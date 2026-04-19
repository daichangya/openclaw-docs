---
read_when:
    - Anda ingin menghubungkan OpenClaw ke WeChat atau Weixin
    - Anda sedang memasang atau memecahkan masalah Plugin channel `openclaw-weixin`
    - Anda perlu memahami bagaimana Plugin channel eksternal berjalan di samping Gateway
summary: Penyiapan channel WeChat melalui Plugin `openclaw-weixin` eksternal
title: WeChat
x-i18n:
    generated_at: "2026-04-19T01:11:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae669f2b6300e0c2b1d1dc57743a0a2ab0c05b9e277ec2ac640a03e6e7ab3b84
    source_path: channels/wechat.md
    workflow: 15
---

# WeChat

OpenClaw terhubung ke WeChat melalui Plugin channel eksternal milik Tencent,
`@tencent-weixin/openclaw-weixin`.

Status: Plugin eksternal. Chat langsung dan media didukung. Chat grup tidak
diiklankan oleh metadata kapabilitas Plugin saat ini.

## Penamaan

- **WeChat** adalah nama yang digunakan untuk pengguna dalam dokumentasi ini.
- **Weixin** adalah nama yang digunakan oleh paket Tencent dan oleh id Plugin.
- `openclaw-weixin` adalah id channel OpenClaw.
- `@tencent-weixin/openclaw-weixin` adalah paket npm.

Gunakan `openclaw-weixin` dalam perintah CLI dan path konfigurasi.

## Cara kerjanya

Kode WeChat tidak berada di repo inti OpenClaw. OpenClaw menyediakan kontrak
Plugin channel generik, dan Plugin eksternal menyediakan runtime khusus
WeChat:

1. `openclaw plugins install` memasang `@tencent-weixin/openclaw-weixin`.
2. Gateway menemukan manifes Plugin dan memuat entrypoint Plugin.
3. Plugin mendaftarkan id channel `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` memulai login QR.
5. Plugin menyimpan kredensial akun di bawah direktori state OpenClaw.
6. Saat Gateway dimulai, Plugin memulai monitor Weixin untuk setiap
   akun yang dikonfigurasi.
7. Pesan WeChat masuk dinormalisasi melalui kontrak channel, dirutekan ke
   agent OpenClaw yang dipilih, lalu dikirim kembali melalui jalur keluar Plugin.

Pemisahan itu penting: inti OpenClaw harus tetap channel-agnostik. Login WeChat,
panggilan API Tencent iLink, unggah/unduh media, token konteks, dan
pemantauan akun dimiliki oleh Plugin eksternal.

## Pemasangan

Pemasangan cepat:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Pemasangan manual:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Mulai ulang Gateway setelah pemasangan:

```bash
openclaw gateway restart
```

## Login

Jalankan login QR di mesin yang sama yang menjalankan Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Pindai kode QR dengan WeChat di ponsel Anda dan konfirmasikan login. Plugin
menyimpan token akun secara lokal setelah pemindaian berhasil.

Untuk menambahkan akun WeChat lain, jalankan lagi perintah login yang sama. Untuk
banyak akun, isolasikan sesi pesan langsung berdasarkan akun, channel, dan pengirim:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Kontrol akses

Pesan langsung menggunakan model pairing dan allowlist OpenClaw normal untuk
Plugin channel.

Setujui pengirim baru:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Untuk model kontrol akses lengkap, lihat [Pairing](/id/channels/pairing).

## Kompatibilitas

Plugin memeriksa versi host OpenClaw saat startup.

| Baris Plugin | Versi OpenClaw         | Tag npm  |
| ------------ | ---------------------- | -------- |
| `2.x`        | `>=2026.3.22`          | `latest` |
| `1.x`        | `>=2026.1.0 <2026.3.22` | `legacy` |

Jika Plugin melaporkan bahwa versi OpenClaw Anda terlalu lama, perbarui
OpenClaw atau pasang baris Plugin legacy:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Proses sidecar

Plugin WeChat dapat menjalankan pekerjaan pembantu di samping Gateway saat
memantau API Tencent iLink. Pada issue #68451, jalur pembantu itu memunculkan bug dalam
pembersihan Gateway usang generik OpenClaw: proses anak dapat mencoba membersihkan proses
Gateway induk, sehingga menyebabkan loop restart di bawah pengelola proses seperti systemd.

Pembersihan startup OpenClaw saat ini mengecualikan proses saat ini dan leluhurnya,
jadi pembantu channel tidak boleh mematikan Gateway yang meluncurkannya. Perbaikan ini
bersifat generik; ini bukan jalur khusus WeChat di inti.

## Pemecahan masalah

Periksa pemasangan dan status:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Jika channel ditampilkan sebagai terpasang tetapi tidak terhubung, pastikan Plugin
diaktifkan lalu mulai ulang:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Jika Gateway berulang kali dimulai ulang setelah mengaktifkan WeChat, perbarui OpenClaw dan
Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Nonaktifkan sementara:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Dokumentasi terkait

- Ikhtisar channel: [Chat Channels](/id/channels)
- Pairing: [Pairing](/id/channels/pairing)
- Perutean channel: [Channel Routing](/id/channels/channel-routing)
- Arsitektur Plugin: [Plugin Architecture](/id/plugins/architecture)
- SDK Plugin channel: [Channel Plugin SDK](/id/plugins/sdk-channel-plugins)
- Paket eksternal: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
