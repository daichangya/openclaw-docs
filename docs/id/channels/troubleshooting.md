---
read_when:
    - Transport channel menyatakan terhubung tetapi balasan gagal
    - Anda memerlukan pemeriksaan khusus channel sebelum membuka dokumentasi provider yang lebih mendalam
summary: Pemecahan masalah tingkat channel yang cepat dengan ciri kegagalan dan perbaikan per channel
title: Pemecahan Masalah Channel
x-i18n:
    generated_at: "2026-04-21T09:16:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e9e8f093bee1c7aafc244d6b999a957b7571cc125096d72060d0df52bf52c0
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Pemecahan masalah channel

Gunakan halaman ini saat sebuah channel terhubung tetapi perilakunya salah.

## Urutan perintah

Jalankan ini terlebih dahulu secara berurutan:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Baseline yang sehat:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, atau `admin-capable`
- Probe channel menunjukkan transport terhubung dan, jika didukung, `works` atau `audit ok`

## WhatsApp

### Ciri kegagalan WhatsApp

| Gejala                          | Pemeriksaan tercepat                              | Perbaikan                                               |
| ------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Terhubung tetapi tidak ada balasan DM | `openclaw pairing list whatsapp`             | Setujui pengirim atau ubah kebijakan DM/allowlist.      |
| Pesan grup diabaikan            | Periksa `requireMention` + pola mention di config | Mention bot atau longgarkan kebijakan mention untuk grup itu. |
| Putus koneksi/login ulang acak berulang | `openclaw channels status --probe` + log | Login ulang dan verifikasi direktori kredensial dalam keadaan sehat. |

Pemecahan masalah lengkap: [/channels/whatsapp#troubleshooting](/id/channels/whatsapp#troubleshooting)

## Telegram

### Ciri kegagalan Telegram

| Gejala                              | Pemeriksaan tercepat                           | Perbaikan                                                                                                                 |
| ----------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/start` tetapi tidak ada alur balasan yang dapat digunakan | `openclaw pairing list telegram` | Setujui pairing atau ubah kebijakan DM.                                                                                  |
| Bot online tetapi grup tetap diam   | Verifikasi persyaratan mention dan mode privasi bot | Nonaktifkan mode privasi untuk visibilitas grup atau mention bot.                                                   |
| Kegagalan pengiriman dengan error jaringan | Periksa log untuk kegagalan panggilan API Telegram | Perbaiki perutean DNS/IPv6/proxy ke `api.telegram.org`.                                                            |
| Polling macet atau reconnect lambat | `openclaw logs --follow` untuk diagnostik polling | Upgrade; jika restart adalah false positive, sesuaikan `pollingStallThresholdMs`. Kemacetan yang persisten tetap mengarah ke proxy/DNS/IPv6. |
| `setMyCommands` ditolak saat startup | Periksa log untuk `BOT_COMMANDS_TOO_MUCH`      | Kurangi perintah Telegram plugin/Skills/kustom atau nonaktifkan menu native.                                            |
| Setelah upgrade, allowlist memblokir Anda | `openclaw security audit` dan allowlist config | Jalankan `openclaw doctor --fix` atau ganti `@username` dengan sender ID numerik.                                       |

Pemecahan masalah lengkap: [/channels/telegram#troubleshooting](/id/channels/telegram#troubleshooting)

## Discord

### Ciri kegagalan Discord

| Gejala                          | Pemeriksaan tercepat                  | Perbaikan                                                  |
| ------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| Bot online tetapi tidak ada balasan guild | `openclaw channels status --probe` | Izinkan guild/channel dan verifikasi intent konten pesan.  |
| Pesan grup diabaikan            | Periksa log untuk drop karena penyaringan mention | Mention bot atau atur guild/channel `requireMention: false`. |
| Balasan DM hilang               | `openclaw pairing list discord`       | Setujui pairing DM atau sesuaikan kebijakan DM.            |

Pemecahan masalah lengkap: [/channels/discord#troubleshooting](/id/channels/discord#troubleshooting)

## Slack

### Ciri kegagalan Slack

| Gejala                                 | Pemeriksaan tercepat                     | Perbaikan                                                                                                                                            |
| -------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode terhubung tetapi tidak ada respons | `openclaw channels status --probe` | Verifikasi app token + bot token dan scope yang diperlukan; perhatikan `botTokenStatus` / `appTokenStatus = configured_unavailable` pada setup berbasis SecretRef. |
| DM diblokir                            | `openclaw pairing list slack`            | Setujui pairing atau longgarkan kebijakan DM.                                                                                                       |
| Pesan channel diabaikan                | Periksa `groupPolicy` dan allowlist channel | Izinkan channel tersebut atau ubah kebijakan menjadi `open`.                                                                                    |

Pemecahan masalah lengkap: [/channels/slack#troubleshooting](/id/channels/slack#troubleshooting)

## iMessage dan BlueBubbles

### Ciri kegagalan iMessage dan BlueBubbles

| Gejala                           | Pemeriksaan tercepat                                              | Perbaikan                                             |
| -------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| Tidak ada peristiwa masuk        | Verifikasi keterjangkauan webhook/server dan izin aplikasi        | Perbaiki URL webhook atau status server BlueBubbles.  |
| Bisa mengirim tetapi tidak bisa menerima di macOS | Periksa izin privasi macOS untuk automasi Messages | Berikan kembali izin TCC dan mulai ulang proses channel. |
| Pengirim DM diblokir             | `openclaw pairing list imessage` atau `openclaw pairing list bluebubbles` | Setujui pairing atau perbarui allowlist.         |

Pemecahan masalah lengkap:

- [/channels/imessage#troubleshooting](/id/channels/imessage#troubleshooting)
- [/channels/bluebubbles#troubleshooting](/id/channels/bluebubbles#troubleshooting)

## Signal

### Ciri kegagalan Signal

| Gejala                          | Pemeriksaan tercepat                     | Perbaikan                                                |
| ------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| Daemon dapat dijangkau tetapi bot diam | `openclaw channels status --probe` | Verifikasi URL/account daemon `signal-cli` dan mode receive. |
| DM diblokir                     | `openclaw pairing list signal`           | Setujui pengirim atau sesuaikan kebijakan DM.            |
| Balasan grup tidak terpicu      | Periksa allowlist grup dan pola mention  | Tambahkan pengirim/grup atau longgarkan penyaringan.     |

Pemecahan masalah lengkap: [/channels/signal#troubleshooting](/id/channels/signal#troubleshooting)

## QQ Bot

### Ciri kegagalan QQ Bot

| Gejala                          | Pemeriksaan tercepat                             | Perbaikan                                                         |
| ------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| Bot membalas "gone to Mars"     | Verifikasi `appId` dan `clientSecret` di config  | Atur kredensial atau mulai ulang gateway.                         |
| Tidak ada pesan masuk           | `openclaw channels status --probe`               | Verifikasi kredensial di QQ Open Platform.                        |
| Suara tidak ditranskripsikan    | Periksa config provider STT                      | Konfigurasikan `channels.qqbot.stt` atau `tools.media.audio`.     |
| Pesan proaktif tidak sampai     | Periksa persyaratan interaksi platform QQ        | QQ dapat memblokir pesan yang dimulai bot tanpa interaksi terbaru. |

Pemecahan masalah lengkap: [/channels/qqbot#troubleshooting](/id/channels/qqbot#troubleshooting)

## Matrix

### Ciri kegagalan Matrix

| Gejala                              | Pemeriksaan tercepat                  | Perbaikan                                                                     |
| ----------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| Sudah login tetapi mengabaikan pesan room | `openclaw channels status --probe` | Periksa `groupPolicy`, allowlist room, dan penyaringan mention.              |
| DM tidak diproses                   | `openclaw pairing list matrix`        | Setujui pengirim atau sesuaikan kebijakan DM.                                 |
| Room terenkripsi gagal              | `openclaw matrix verify status`       | Verifikasi ulang device, lalu periksa `openclaw matrix verify backup status`. |
| Pemulihan backup tertunda/rusak     | `openclaw matrix verify backup status` | Jalankan `openclaw matrix verify backup restore` atau jalankan ulang dengan recovery key. |
| Cross-signing/bootstrap terlihat salah | `openclaw matrix verify bootstrap`  | Perbaiki secret storage, cross-signing, dan status backup dalam satu langkah. |

Setup dan config lengkap: [Matrix](/id/channels/matrix)
