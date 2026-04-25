---
read_when:
    - Anda ingin menghubungkan OpenClaw ke QQ
    - Anda perlu menyiapkan kredensial Bot QQ
    - Anda ingin dukungan grup atau chat pribadi Bot QQ
summary: Penyiapan, konfigurasi, dan penggunaan Bot QQ
title: Bot QQ
x-i18n:
    generated_at: "2026-04-25T13:41:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1219f8d6ca3996272b293cc042364300f0fdfea6c7f19585e4ee514ac2182d46
    source_path: channels/qqbot.md
    workflow: 15
---

QQ Bot terhubung ke OpenClaw melalui API QQ Bot resmi (gateway WebSocket). Plugin
ini mendukung chat pribadi C2C, @messages grup, dan pesan kanal guild dengan
media kaya (gambar, suara, video, file).

Status: plugin bawaan. Pesan langsung, chat grup, kanal guild, dan
media didukung. Reaksi dan thread tidak didukung.

## Plugin bawaan

Rilis OpenClaw saat ini menyertakan QQ Bot, jadi build paket normal tidak memerlukan
langkah `openclaw plugins install` terpisah.

## Penyiapan

1. Buka [QQ Open Platform](https://q.qq.com/) dan pindai kode QR dengan
   QQ di ponsel Anda untuk mendaftar / masuk.
2. Klik **Create Bot** untuk membuat bot QQ baru.
3. Temukan **AppID** dan **AppSecret** di halaman pengaturan bot lalu salin.

> AppSecret tidak disimpan dalam plaintext — jika Anda meninggalkan halaman tanpa menyimpannya,
> Anda harus membuat ulang yang baru.

4. Tambahkan kanal:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Mulai ulang Gateway.

Jalur penyiapan interaktif:

```bash
openclaw channels add
openclaw configure --section channels
```

## Konfigurasi

Konfigurasi minimal:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Variabel env akun default:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret berbasis file:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Catatan:

- Fallback env hanya berlaku untuk akun QQ Bot default.
- `openclaw channels add --channel qqbot --token-file ...` hanya menyediakan
  AppSecret; AppID harus sudah diatur di konfigurasi atau `QQBOT_APP_ID`.
- `clientSecret` juga menerima input SecretRef, bukan hanya string plaintext.

### Penyiapan multi-akun

Jalankan beberapa bot QQ dalam satu instance OpenClaw:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Setiap akun menjalankan koneksi WebSocket sendiri dan mempertahankan cache
token yang independen (terisolasi berdasarkan `appId`).

Tambahkan bot kedua melalui CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Suara (STT / TTS)

Dukungan STT dan TTS menggunakan konfigurasi dua tingkat dengan fallback prioritas:

| Pengaturan | Khusus plugin        | Fallback framework             |
| ---------- | -------------------- | ------------------------------ |
| STT        | `channels.qqbot.stt` | `tools.media.audio.models[0]`  |
| TTS        | `channels.qqbot.tts` | `messages.tts`                 |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

Atur `enabled: false` pada salah satunya untuk menonaktifkan.

Lampiran suara QQ masuk ditampilkan ke agen sebagai metadata media audio sambil
menjaga file suara mentah tetap di luar `MediaPaths` generik. Balasan plaintext
`[[audio_as_voice]]` akan mensintesis TTS dan mengirim pesan suara QQ native saat TTS
dikonfigurasi.

Perilaku unggah/transkode audio keluar juga dapat disetel dengan
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Format target

| Format                     | Deskripsi           |
| -------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | Chat pribadi (C2C)  |
| `qqbot:group:GROUP_OPENID` | Chat grup           |
| `qqbot:channel:CHANNEL_ID` | Kanal guild         |

> Setiap bot memiliki kumpulan OpenID pengguna sendiri. OpenID yang diterima oleh Bot A **tidak dapat**
> digunakan untuk mengirim pesan melalui Bot B.

## Perintah slash

Perintah bawaan yang dicegat sebelum antrean AI:

| Perintah       | Deskripsi                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Uji latensi                                                                                                 |
| `/bot-version` | Tampilkan versi framework OpenClaw                                                                           |
| `/bot-help`    | Daftarkan semua perintah                                                                                    |
| `/bot-upgrade` | Tampilkan tautan panduan upgrade QQBot                                                                      |
| `/bot-logs`    | Ekspor log gateway terbaru sebagai file                                                                     |
| `/bot-approve` | Setujui tindakan QQ Bot yang tertunda (misalnya, mengonfirmasi unggahan C2C atau grup) melalui alur native. |

Tambahkan `?` ke perintah apa pun untuk bantuan penggunaan (misalnya `/bot-upgrade ?`).

## Arsitektur engine

QQ Bot dikirim sebagai engine mandiri di dalam plugin:

- Setiap akun memiliki stack resource terisolasi (koneksi WebSocket, klien API, cache token, root penyimpanan media) yang dikunci dengan `appId`. Akun tidak pernah berbagi status masuk/keluar.
- Logger multi-akun menandai baris log dengan akun pemilik sehingga diagnostik tetap terpisah saat Anda menjalankan beberapa bot di bawah satu gateway.
- Jalur inbound, outbound, dan bridge gateway berbagi satu root payload media di bawah `~/.openclaw/media`, sehingga unggahan, unduhan, dan cache transkode berada di bawah satu direktori yang dijaga, bukan tree per subsistem.
- Kredensial dapat dicadangkan dan dipulihkan sebagai bagian dari snapshot kredensial OpenClaw standar; engine memasang kembali stack resource setiap akun saat pemulihan tanpa memerlukan pairing kode QR baru.

## Onboarding kode QR

Sebagai alternatif untuk menempelkan `AppID:AppSecret` secara manual, engine mendukung alur onboarding kode QR untuk menautkan QQ Bot ke OpenClaw:

1. Jalankan jalur penyiapan QQ Bot (misalnya `openclaw channels add --channel qqbot`) dan pilih alur kode QR saat diminta.
2. Pindai kode QR yang dihasilkan dengan aplikasi ponsel yang terikat ke QQ Bot target.
3. Setujui pairing di ponsel. OpenClaw menyimpan kredensial yang dikembalikan ke `credentials/` dalam scope akun yang tepat.

Prompt persetujuan yang dibuat oleh bot itu sendiri (misalnya, alur "allow this action?" yang diekspos oleh API QQ Bot) ditampilkan sebagai prompt OpenClaw native yang dapat Anda setujui dengan `/bot-approve` alih-alih membalas melalui klien QQ mentah.

## Pemecahan masalah

- **Bot membalas "gone to Mars":** kredensial belum dikonfigurasi atau Gateway belum dimulai.
- **Tidak ada pesan masuk:** verifikasi `appId` dan `clientSecret` benar, dan
  bot diaktifkan di QQ Open Platform.
- **Penyiapan dengan `--token-file` masih menampilkan belum dikonfigurasi:** `--token-file` hanya mengatur
  AppSecret. Anda tetap memerlukan `appId` di konfigurasi atau `QQBOT_APP_ID`.
- **Pesan proaktif tidak sampai:** QQ dapat mencegat pesan yang diprakarsai bot jika
  pengguna belum berinteraksi baru-baru ini.
- **Suara tidak ditranskripsikan:** pastikan STT dikonfigurasi dan provider dapat dijangkau.

## Terkait

- [Pairing](/id/channels/pairing)
- [Groups](/id/channels/groups)
- [Channel troubleshooting](/id/channels/troubleshooting)
