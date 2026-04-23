---
read_when:
    - Menyiapkan Synology Chat dengan OpenClaw
    - Men-debug perutean Webhook Synology Chat
summary: Penyiapan Webhook Synology Chat dan konfigurasi OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T09:17:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9cafbf543b8ce255e634bc4d54012652d3887ac23b31b97899dc7cec9d0688f
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Status: plugin bawaan channel pesan langsung yang menggunakan Webhook Synology Chat.
Plugin ini menerima pesan masuk dari outgoing webhook Synology Chat dan mengirim balasan
melalui incoming webhook Synology Chat.

## Plugin bawaan

Synology Chat dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, sehingga build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang tidak menyertakan Synology Chat,
instal secara manual:

Instal dari checkout lokal:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detail: [Plugins](/id/tools/plugin)

## Penyiapan cepat

1. Pastikan plugin Synology Chat tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dari source checkout dengan perintah di atas.
   - `openclaw onboard` sekarang menampilkan Synology Chat dalam daftar penyiapan channel yang sama dengan `openclaw channels add`.
   - Penyiapan non-interaktif: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Di integrasi Synology Chat:
   - Buat incoming webhook dan salin URL-nya.
   - Buat outgoing webhook dengan token rahasia Anda.
3. Arahkan URL outgoing webhook ke Gateway OpenClaw Anda:
   - `https://gateway-host/webhook/synology` secara default.
   - Atau `channels.synology-chat.webhookPath` kustom Anda.
4. Selesaikan penyiapan di OpenClaw.
   - Terpandu: `openclaw onboard`
   - Langsung: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Restart Gateway dan kirim DM ke bot Synology Chat.

Detail autentikasi Webhook:

- OpenClaw menerima token outgoing webhook dari `body.token`, lalu
  `?token=...`, lalu header.
- Bentuk header yang diterima:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Token kosong atau tidak ada akan gagal secara fail-closed.

Konfigurasi minimal:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Variabel lingkungan

Untuk akun default, Anda dapat menggunakan variabel lingkungan:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (dipisahkan koma)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Nilai konfigurasi menimpa variabel lingkungan.

`SYNOLOGY_CHAT_INCOMING_URL` tidak dapat disetel dari `.env` workspace; lihat [File `.env` workspace](/id/gateway/security).

## Kebijakan DM dan kontrol akses

- `dmPolicy: "allowlist"` adalah default yang direkomendasikan.
- `allowedUserIds` menerima daftar (atau string dipisahkan koma) ID pengguna Synology.
- Dalam mode `allowlist`, daftar `allowedUserIds` yang kosong diperlakukan sebagai salah konfigurasi dan rute Webhook tidak akan dimulai (gunakan `dmPolicy: "open"` untuk mengizinkan semua).
- `dmPolicy: "open"` mengizinkan pengirim mana pun.
- `dmPolicy: "disabled"` memblokir DM.
- Pengikatan penerima balasan tetap menggunakan `user_id` numerik yang stabil secara default. `channels.synology-chat.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas break-glass yang mengaktifkan kembali pencarian username/nickname yang dapat berubah untuk pengiriman balasan.
- Persetujuan pairing berfungsi dengan:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Pengiriman keluar

Gunakan ID pengguna Synology Chat numerik sebagai target.

Contoh:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Pengiriman media didukung melalui pengiriman file berbasis URL.
URL file keluar harus menggunakan `http` atau `https`, dan target jaringan privat atau target yang diblokir ditolak sebelum OpenClaw meneruskan URL ke Webhook NAS.

## Multi-akun

Beberapa akun Synology Chat didukung di bawah `channels.synology-chat.accounts`.
Setiap akun dapat menimpa token, incoming URL, jalur webhook, kebijakan DM, dan batas.
Sesi pesan langsung diisolasi per akun dan pengguna, sehingga `user_id` numerik yang sama
di dua akun Synology yang berbeda tidak berbagi status transkrip.
Berikan `webhookPath` yang berbeda untuk setiap akun yang diaktifkan. OpenClaw sekarang menolak jalur persis yang duplikat
dan menolak memulai akun bernama yang hanya mewarisi jalur webhook bersama dalam penyiapan multi-akun.
Jika Anda memang memerlukan pewarisan lama untuk akun bernama, setel
`dangerouslyAllowInheritedWebhookPath: true` pada akun tersebut atau di `channels.synology-chat`,
tetapi jalur persis yang duplikat tetap ditolak secara fail-closed. Lebih baik gunakan jalur eksplisit per akun.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Catatan keamanan

- Jaga `token` tetap rahasia dan rotasi jika bocor.
- Biarkan `allowInsecureSsl: false` kecuali Anda secara eksplisit memercayai sertifikat NAS lokal self-signed.
- Permintaan Webhook masuk diverifikasi token dan dibatasi lajunya per pengirim.
- Pemeriksaan token tidak valid menggunakan perbandingan rahasia waktu-konstan dan fail-closed.
- Gunakan `dmPolicy: "allowlist"` untuk produksi.
- Biarkan `dangerouslyAllowNameMatching` nonaktif kecuali Anda memang memerlukan pengiriman balasan lama berbasis username.
- Biarkan `dangerouslyAllowInheritedWebhookPath` nonaktif kecuali Anda secara eksplisit menerima risiko perutean jalur bersama dalam penyiapan multi-akun.

## Pemecahan masalah

- `Missing required fields (token, user_id, text)`:
  - payload outgoing webhook tidak memiliki salah satu field yang wajib
  - jika Synology mengirim token dalam header, pastikan gateway/proxy mempertahankan header tersebut
- `Invalid token`:
  - secret outgoing webhook tidak cocok dengan `channels.synology-chat.token`
  - permintaan mengenai akun/jalur webhook yang salah
  - reverse proxy menghapus header token sebelum permintaan mencapai OpenClaw
- `Rate limit exceeded`:
  - terlalu banyak percobaan token tidak valid dari sumber yang sama dapat mengunci sementara sumber itu
  - pengirim yang terautentikasi juga memiliki batas laju pesan terpisah per pengguna
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` diaktifkan tetapi tidak ada pengguna yang dikonfigurasi
- `User not authorized`:
  - `user_id` numerik pengirim tidak ada dalam `allowedUserIds`

## Terkait

- [Channels Overview](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Channel Routing](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan penguatan keamanan
