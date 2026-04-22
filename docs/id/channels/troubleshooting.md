---
read_when:
    - Transport channel menunjukkan terhubung tetapi balasan gagal
    - Anda memerlukan pemeriksaan khusus channel sebelum masuk ke dokumentasi provider yang lebih mendalam
summary: Pemecahan masalah tingkat channel yang cepat dengan signature kegagalan dan perbaikan per channel
title: Pemecahan Masalah Channel
x-i18n:
    generated_at: "2026-04-22T04:20:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c57934b52086ea5f41565c5aae77ef6fa772cf7d56a6427655a844a5c63d1c6
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Pemecahan masalah channel

Gunakan halaman ini saat sebuah channel terhubung tetapi perilakunya salah.

## Urutan perintah

Jalankan ini secara berurutan terlebih dahulu:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Baseline sehat:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, atau `admin-capable`
- Probe channel menunjukkan transport terhubung dan, jika didukung, `works` atau `audit ok`

## WhatsApp

### Signature kegagalan WhatsApp

| Gejala                          | Pemeriksaan tercepat                               | Perbaikan                                               |
| ------------------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| Terhubung tetapi tidak ada balasan DM | `openclaw pairing list whatsapp`               | Setujui pengirim atau ubah kebijakan/allowlist DM.      |
| Pesan grup diabaikan            | Periksa `requireMention` + pola mention di config | Mention bot atau longgarkan kebijakan mention untuk grup itu. |
| Putus sambung/login ulang acak  | `openclaw channels status --probe` + log         | Login ulang dan verifikasi direktori kredensial sehat.  |

Pemecahan masalah lengkap: [Pemecahan masalah WhatsApp](/id/channels/whatsapp#troubleshooting)

## Telegram

### Signature kegagalan Telegram

| Gejala                              | Pemeriksaan tercepat                              | Perbaikan                                                                                                                   |
| ----------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `/start` tetapi tidak ada alur balasan yang dapat digunakan | `openclaw pairing list telegram` | Setujui pairing atau ubah kebijakan DM.                                                                                     |
| Bot online tetapi grup tetap diam   | Verifikasi persyaratan mention dan mode privasi bot | Nonaktifkan mode privasi untuk visibilitas grup atau mention bot.                                                           |
| Gagal mengirim dengan error jaringan | Periksa log untuk kegagalan panggilan API Telegram | Perbaiki routing DNS/IPv6/proxy ke `api.telegram.org`.                                                                      |
| Polling macet atau reconnect lambat | `openclaw logs --follow` untuk diagnostik polling | Upgrade; jika restart adalah false positive, sesuaikan `pollingStallThresholdMs`. Kemacetan yang persisten tetap mengarah ke proxy/DNS/IPv6. |
| `setMyCommands` ditolak saat startup | Periksa log untuk `BOT_COMMANDS_TOO_MUCH`         | Kurangi perintah Telegram plugin/Skills/kustom atau nonaktifkan menu native.                                               |
| Sudah upgrade dan allowlist memblokir Anda | `openclaw security audit` dan allowlist config | Jalankan `openclaw doctor --fix` atau ganti `@username` dengan ID pengirim numerik.                                        |

Pemecahan masalah lengkap: [Pemecahan masalah Telegram](/id/channels/telegram#troubleshooting)

## Discord

### Signature kegagalan Discord

| Gejala                          | Pemeriksaan tercepat                  | Perbaikan                                                   |
| ------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| Bot online tetapi tidak ada balasan di guild | `openclaw channels status --probe` | Izinkan guild/channel dan verifikasi intent konten pesan.   |
| Pesan grup diabaikan            | Periksa log untuk drop gating mention | Mention bot atau atur guild/channel `requireMention: false`. |
| Balasan DM tidak ada            | `openclaw pairing list discord`       | Setujui pairing DM atau sesuaikan kebijakan DM.             |

Pemecahan masalah lengkap: [Pemecahan masalah Discord](/id/channels/discord#troubleshooting)

## Slack

### Signature kegagalan Slack

| Gejala                                 | Pemeriksaan tercepat                      | Perbaikan                                                                                                                                               |
| -------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode terhubung tetapi tidak ada respons | `openclaw channels status --probe` | Verifikasi app token + bot token dan scope yang diperlukan; perhatikan `botTokenStatus` / `appTokenStatus = configured_unavailable` pada penyiapan berbasis SecretRef. |
| DM diblokir                            | `openclaw pairing list slack`             | Setujui pairing atau longgarkan kebijakan DM.                                                                                                           |
| Pesan channel diabaikan                | Periksa `groupPolicy` dan allowlist channel | Izinkan channel atau ubah kebijakan menjadi `open`.                                                                                                     |

Pemecahan masalah lengkap: [Pemecahan masalah Slack](/id/channels/slack#troubleshooting)

## iMessage dan BlueBubbles

### Signature kegagalan iMessage dan BlueBubbles

| Gejala                           | Pemeriksaan tercepat                                                     | Perbaikan                                               |
| -------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Tidak ada event masuk            | Verifikasi keterjangkauan webhook/server dan izin aplikasi               | Perbaiki URL webhook atau status server BlueBubbles.    |
| Bisa mengirim tetapi tidak menerima di macOS | Periksa izin privasi macOS untuk otomatisasi Messages      | Berikan ulang izin TCC dan mulai ulang proses channel.  |
| Pengirim DM diblokir             | `openclaw pairing list imessage` atau `openclaw pairing list bluebubbles` | Setujui pairing atau perbarui allowlist.                |

Pemecahan masalah lengkap:

- [Pemecahan masalah iMessage](/id/channels/imessage#troubleshooting)
- [Pemecahan masalah BlueBubbles](/id/channels/bluebubbles#troubleshooting)

## Signal

### Signature kegagalan Signal

| Gejala                          | Pemeriksaan tercepat                      | Perbaikan                                                    |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| Daemon dapat dijangkau tetapi bot diam | `openclaw channels status --probe`   | Verifikasi URL/akun daemon `signal-cli` dan mode receive.    |
| DM diblokir                     | `openclaw pairing list signal`            | Setujui pengirim atau sesuaikan kebijakan DM.                |
| Balasan grup tidak terpicu      | Periksa allowlist grup dan pola mention   | Tambahkan pengirim/grup atau longgarkan gating.              |

Pemecahan masalah lengkap: [Pemecahan masalah Signal](/id/channels/signal#troubleshooting)

## Bot QQ

### Signature kegagalan Bot QQ

| Gejala                          | Pemeriksaan tercepat                         | Perbaikan                                                           |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| Bot menjawab "gone to Mars"     | Verifikasi `appId` dan `clientSecret` di config | Atur kredensial atau mulai ulang gateway.                         |
| Tidak ada pesan masuk           | `openclaw channels status --probe`           | Verifikasi kredensial di QQ Open Platform.                          |
| Suara tidak ditranskripsikan    | Periksa config provider STT                  | Konfigurasikan `channels.qqbot.stt` atau `tools.media.audio`.       |
| Pesan proaktif tidak sampai     | Periksa persyaratan interaksi platform QQ    | QQ dapat memblokir pesan yang dimulai bot tanpa interaksi terbaru.  |

Pemecahan masalah lengkap: [Pemecahan masalah Bot QQ](/id/channels/qqbot#troubleshooting)

## Matrix

### Signature kegagalan Matrix

| Gejala                               | Pemeriksaan tercepat                    | Perbaikan                                                                    |
| ------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------- |
| Sudah login tetapi mengabaikan pesan room | `openclaw channels status --probe` | Periksa `groupPolicy`, allowlist room, dan gating mention.                  |
| DM tidak diproses                    | `openclaw pairing list matrix`          | Setujui pengirim atau sesuaikan kebijakan DM.                               |
| Room terenkripsi gagal               | `openclaw matrix verify status`         | Verifikasi ulang perangkat, lalu periksa `openclaw matrix verify backup status`. |
| Pemulihan backup tertunda/rusak      | `openclaw matrix verify backup status`  | Jalankan `openclaw matrix verify backup restore` atau jalankan ulang dengan recovery key. |
| Cross-signing/bootstrap terlihat salah | `openclaw matrix verify bootstrap`    | Perbaiki penyimpanan secret, cross-signing, dan status backup dalam satu langkah. |

Penyiapan dan konfigurasi lengkap: [Matrix](/id/channels/matrix)
