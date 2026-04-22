---
read_when:
    - Anda ingin menghubungkan OpenClaw ke QQ
    - Anda memerlukan penyiapan kredensial Bot QQ
    - Anda menginginkan dukungan grup atau chat pribadi Bot QQ
summary: Penyiapan, konfigurasi, dan penggunaan Bot QQ
title: Bot QQ
x-i18n:
    generated_at: "2026-04-22T04:20:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49a5ae5615935a435a69748a3c4465ae8c33d3ab84db5e37fd8beec70506ce36
    source_path: channels/qqbot.md
    workflow: 15
---

# Bot QQ

Bot QQ terhubung ke OpenClaw melalui API Bot QQ resmi (gateway WebSocket). Plugin ini
mendukung chat pribadi C2C, @message grup, dan pesan channel guild dengan
media kaya (gambar, suara, video, file).

Status: plugin bawaan. Pesan langsung, chat grup, channel guild, dan
media didukung. Reaksi dan thread tidak didukung.

## Plugin bawaan

Rilis OpenClaw saat ini menyertakan Bot QQ, jadi build paket normal tidak memerlukan
langkah `openclaw plugins install` terpisah.

## Penyiapan

1. Buka [QQ Open Platform](https://q.qq.com/) dan pindai kode QR dengan
   QQ di ponsel Anda untuk mendaftar / masuk.
2. Klik **Create Bot** untuk membuat bot QQ baru.
3. Temukan **AppID** dan **AppSecret** di halaman pengaturan bot lalu salin keduanya.

> AppSecret tidak disimpan dalam plaintext — jika Anda meninggalkan halaman tanpa menyimpannya,
> Anda harus membuat ulang yang baru.

4. Tambahkan channel:

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

Variabel lingkungan akun default:

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

- Fallback env hanya berlaku untuk akun default Bot QQ.
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

Setiap akun menjalankan koneksi WebSocket-nya sendiri dan mempertahankan cache
token yang independen (diisolasi berdasarkan `appId`).

Tambahkan bot kedua melalui CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Suara (STT / TTS)

Dukungan STT dan TTS memiliki konfigurasi dua tingkat dengan fallback prioritas:

| Setting | Khusus plugin        | Fallback framework           |
| ------- | -------------------- | ---------------------------- |
| STT     | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts` | `messages.tts`                |

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

Perilaku upload/transcode audio keluar juga dapat disesuaikan dengan
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Format target

| Format                     | Deskripsi          |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat pribadi (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat grup          |
| `qqbot:channel:CHANNEL_ID` | Channel guild      |

> Setiap bot memiliki kumpulan OpenID penggunanya sendiri. OpenID yang diterima oleh Bot A **tidak dapat**
> digunakan untuk mengirim pesan melalui Bot B.

## Perintah slash

Perintah bawaan yang diintersepsi sebelum antrean AI:

| Command        | Deskripsi                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Uji latensi                                                                                                    |
| `/bot-version` | Tampilkan versi framework OpenClaw                                                                              |
| `/bot-help`    | Daftarkan semua perintah                                                                                        |
| `/bot-upgrade` | Tampilkan tautan panduan upgrade QQBot                                                                          |
| `/bot-logs`    | Ekspor log gateway terbaru sebagai file                                                                         |
| `/bot-approve` | Setujui tindakan Bot QQ yang tertunda (misalnya, mengonfirmasi upload C2C atau grup) melalui alur native. |

Tambahkan `?` ke perintah apa pun untuk bantuan penggunaan (misalnya `/bot-upgrade ?`).

## Arsitektur engine

Bot QQ dikirim sebagai engine mandiri di dalam plugin:

- Setiap akun memiliki stack resource terisolasi (koneksi WebSocket, klien API, cache token, root penyimpanan media) yang dikunci oleh `appId`. Akun tidak pernah berbagi state masuk/keluar.
- Logger multi-akun menandai baris log dengan akun pemilik agar diagnostik tetap terpisah saat Anda menjalankan beberapa bot di satu gateway.
- Jalur bridge masuk, keluar, dan gateway berbagi satu root payload media di bawah `~/.openclaw/media`, sehingga upload, unduhan, dan cache transcode ditempatkan di satu direktori yang dilindungi alih-alih pohon per subsistem.
- Kredensial dapat dicadangkan dan dipulihkan sebagai bagian dari snapshot kredensial OpenClaw standar; engine memasang ulang stack resource setiap akun saat pemulihan tanpa memerlukan pairing kode QR baru.

## Onboarding kode QR

Sebagai alternatif selain menempelkan `AppID:AppSecret` secara manual, engine mendukung alur onboarding kode QR untuk menautkan Bot QQ ke OpenClaw:

1. Jalankan jalur penyiapan Bot QQ (misalnya `openclaw channels add --channel qqbot`) dan pilih alur kode QR saat diminta.
2. Pindai kode QR yang dihasilkan dengan aplikasi ponsel yang terkait dengan Bot QQ target.
3. Setujui pairing di ponsel. OpenClaw menyimpan kredensial yang dikembalikan ke `credentials/` dalam cakupan akun yang tepat.

Prompt persetujuan yang dihasilkan oleh bot itu sendiri (misalnya alur "izinkan tindakan ini?" yang diekspos oleh API Bot QQ) muncul sebagai prompt native OpenClaw yang dapat Anda terima dengan `/bot-approve` alih-alih membalas melalui klien QQ mentah.

## Pemecahan masalah

- **Bot menjawab "gone to Mars":** kredensial belum dikonfigurasi atau Gateway belum dijalankan.
- **Tidak ada pesan masuk:** verifikasi bahwa `appId` dan `clientSecret` benar, dan
  bot diaktifkan di QQ Open Platform.
- **Penyiapan dengan `--token-file` masih menunjukkan belum dikonfigurasi:** `--token-file` hanya mengatur
  AppSecret. Anda tetap memerlukan `appId` di konfigurasi atau `QQBOT_APP_ID`.
- **Pesan proaktif tidak sampai:** QQ dapat mencegat pesan yang dimulai bot jika
  pengguna belum berinteraksi baru-baru ini.
- **Suara tidak ditranskripsikan:** pastikan STT telah dikonfigurasi dan provider dapat dijangkau.
