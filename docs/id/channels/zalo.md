---
read_when:
    - Mengerjakan fitur atau Webhook Zalo
summary: Status dukungan, kemampuan, dan konfigurasi bot Zalo
title: Zalo
x-i18n:
    generated_at: "2026-04-25T13:42:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

Status: eksperimental. DM didukung. Bagian [Capabilities](#capabilities) di bawah mencerminkan perilaku bot Marketplace saat ini.

## Plugin bawaan

Zalo dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build paket
normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Zalo, instal
secara manual:

- Instal melalui CLI: `openclaw plugins install @openclaw/zalo`
- Atau dari checkout source: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detail: [Plugins](/id/tools/plugin)

## Penyiapan cepat (pemula)

1. Pastikan plugin Zalo tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Setel token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Atau config: `channels.zalo.accounts.default.botToken: "..."`.
3. Mulai ulang gateway (atau selesaikan penyiapan).
4. Akses DM secara default menggunakan pairing; setujui kode pairing saat kontak pertama.

Konfigurasi minimal:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Apa itu

Zalo adalah aplikasi pesan yang berfokus pada Vietnam; API Bot-nya memungkinkan Gateway menjalankan bot untuk percakapan 1:1.
Ini cocok untuk dukungan atau notifikasi saat Anda menginginkan routing yang deterministik kembali ke Zalo.

Halaman ini mencerminkan perilaku OpenClaw saat ini untuk **bot Zalo Bot Creator / Marketplace**.
**bot Zalo Official Account (OA)** adalah surface produk Zalo yang berbeda dan dapat berperilaku berbeda.

- Kanal API Bot Zalo yang dimiliki oleh Gateway.
- Routing deterministik: balasan kembali ke Zalo; model tidak pernah memilih kanal.
- DM berbagi sesi utama agen.
- Bagian [Capabilities](#capabilities) di bawah menunjukkan dukungan bot Marketplace saat ini.

## Penyiapan (jalur cepat)

### 1) Buat token bot (Zalo Bot Platform)

1. Buka [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) dan masuk.
2. Buat bot baru dan konfigurasikan pengaturannya.
3. Salin token bot lengkap (biasanya `numeric_id:secret`). Untuk bot Marketplace, token runtime yang dapat digunakan dapat muncul di pesan sambutan bot setelah pembuatan.

### 2) Konfigurasikan token (env atau config)

Contoh:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Jika nanti Anda berpindah ke surface bot Zalo tempat grup tersedia, Anda dapat menambahkan konfigurasi khusus grup seperti `groupPolicy` dan `groupAllowFrom` secara eksplisit. Untuk perilaku bot Marketplace saat ini, lihat [Capabilities](#capabilities).

Opsi env: `ZALO_BOT_TOKEN=...` (hanya berfungsi untuk akun default).

Dukungan multi-akun: gunakan `channels.zalo.accounts` dengan token per akun dan `name` opsional.

3. Mulai ulang gateway. Zalo akan mulai saat token berhasil di-resolve (env atau config).
4. Akses DM default-nya adalah pairing. Setujui kode saat bot pertama kali dihubungi.

## Cara kerjanya (perilaku)

- Pesan masuk dinormalisasi ke envelope kanal bersama dengan placeholder media.
- Balasan selalu dirutekan kembali ke chat Zalo yang sama.
- Long-polling secara default; mode Webhook tersedia dengan `channels.zalo.webhookUrl`.

## Batasan

- Teks keluar dipotong per 2000 karakter (batas API Zalo).
- Unduhan/unggahan media dibatasi oleh `channels.zalo.mediaMaxMb` (default 5).
- Streaming diblokir secara default karena batas 2000 karakter membuat streaming kurang berguna.

## Kontrol akses (DM)

### Akses DM

- Default: `channels.zalo.dmPolicy = "pairing"`. Pengirim yang tidak dikenal menerima kode pairing; pesan diabaikan sampai disetujui (kode kedaluwarsa setelah 1 jam).
- Setujui melalui:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Pairing adalah pertukaran token default. Detail: [Pairing](/id/channels/pairing)
- `channels.zalo.allowFrom` menerima ID pengguna numerik (pencarian username tidak tersedia).

## Kontrol akses (Grup)

Untuk **bot Zalo Bot Creator / Marketplace**, dukungan grup tidak tersedia dalam praktik karena bot sama sekali tidak dapat ditambahkan ke grup.

Artinya, kunci config terkait grup di bawah ini ada dalam schema, tetapi tidak dapat digunakan untuk bot Marketplace:

- `channels.zalo.groupPolicy` mengontrol penanganan pesan masuk grup: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` membatasi ID pengirim mana yang dapat memicu bot di grup.
- Jika `groupAllowFrom` tidak disetel, Zalo menggunakan `allowFrom` sebagai fallback untuk pemeriksaan pengirim.
- Catatan runtime: jika `channels.zalo` tidak ada sama sekali, runtime tetap menggunakan fallback `groupPolicy="allowlist"` demi keamanan.

Nilai kebijakan grup (saat akses grup tersedia pada surface bot Anda) adalah:

- `groupPolicy: "disabled"` — memblokir semua pesan grup.
- `groupPolicy: "open"` — mengizinkan anggota grup mana pun (dengan gate penyebutan).
- `groupPolicy: "allowlist"` — default fail-closed; hanya pengirim yang diizinkan yang diterima.

Jika Anda menggunakan surface produk bot Zalo yang berbeda dan telah memverifikasi perilaku grup yang berfungsi, dokumentasikan itu secara terpisah alih-alih mengasumsikan bahwa itu cocok dengan alur bot Marketplace.

## Long-polling vs Webhook

- Default: long-polling (tidak memerlukan URL publik).
- Mode Webhook: setel `channels.zalo.webhookUrl` dan `channels.zalo.webhookSecret`.
  - Secret Webhook harus sepanjang 8-256 karakter.
  - URL Webhook harus menggunakan HTTPS.
  - Zalo mengirim peristiwa dengan header `X-Bot-Api-Secret-Token` untuk verifikasi.
  - HTTP Gateway menangani permintaan Webhook di `channels.zalo.webhookPath` (default ke path URL Webhook).
  - Permintaan harus menggunakan `Content-Type: application/json` (atau tipe media `+json`).
  - Peristiwa duplikat (`event_name + message_id`) diabaikan untuk jangka waktu replay singkat.
  - Lonjakan trafik dibatasi lajunya per path/sumber dan dapat mengembalikan HTTP 429.

**Catatan:** getUpdates (polling) dan Webhook saling eksklusif menurut dokumen API Zalo.

## Jenis pesan yang didukung

Untuk ringkasan dukungan cepat, lihat [Capabilities](#capabilities). Catatan di bawah ini menambahkan detail saat perilaku memerlukan konteks tambahan.

- **Pesan teks**: Dukungan penuh dengan pemotongan per 2000 karakter.
- **URL polos di dalam teks**: Berperilaku seperti input teks normal.
- **Pratinjau tautan / kartu tautan kaya**: Lihat status bot Marketplace di [Capabilities](#capabilities); ini tidak secara andal memicu balasan.
- **Pesan gambar**: Lihat status bot Marketplace di [Capabilities](#capabilities); penanganan gambar masuk tidak andal (indikator mengetik tanpa balasan akhir).
- **Stiker**: Lihat status bot Marketplace di [Capabilities](#capabilities).
- **Catatan suara / file audio / video / lampiran file generik**: Lihat status bot Marketplace di [Capabilities](#capabilities).
- **Jenis yang tidak didukung**: Dicatat ke log (misalnya, pesan dari pengguna terlindungi).

## Capabilities

Tabel ini merangkum perilaku **bot Zalo Bot Creator / Marketplace** saat ini di OpenClaw.

| Fitur                       | Status                                  |
| --------------------------- | --------------------------------------- |
| Pesan langsung              | ✅ Didukung                             |
| Grup                        | ❌ Tidak tersedia untuk bot Marketplace |
| Media (gambar masuk)        | ⚠️ Terbatas / verifikasi di environment Anda |
| Media (gambar keluar)       | ⚠️ Belum diuji ulang untuk bot Marketplace |
| URL polos dalam teks        | ✅ Didukung                             |
| Pratinjau tautan            | ⚠️ Tidak andal untuk bot Marketplace    |
| Reaksi                      | ❌ Tidak didukung                       |
| Stiker                      | ⚠️ Tidak ada balasan agen untuk bot Marketplace |
| Catatan suara / audio / video | ⚠️ Tidak ada balasan agen untuk bot Marketplace |
| Lampiran file               | ⚠️ Tidak ada balasan agen untuk bot Marketplace |
| Thread                      | ❌ Tidak didukung                       |
| Polling                     | ❌ Tidak didukung                       |
| Perintah native             | ❌ Tidak didukung                       |
| Streaming                   | ⚠️ Diblokir (batas 2000 karakter)       |

## Target pengiriman (CLI/cron)

- Gunakan chat id sebagai target.
- Contoh: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Pemecahan masalah

**Bot tidak merespons:**

- Periksa apakah token valid: `openclaw channels status --probe`
- Verifikasi bahwa pengirim telah disetujui (pairing atau allowFrom)
- Periksa log gateway: `openclaw logs --follow`

**Webhook tidak menerima peristiwa:**

- Pastikan URL Webhook menggunakan HTTPS
- Verifikasi secret token sepanjang 8-256 karakter
- Konfirmasikan endpoint HTTP gateway dapat dijangkau pada path yang dikonfigurasi
- Periksa bahwa polling getUpdates tidak berjalan (keduanya saling eksklusif)

## Referensi konfigurasi (Zalo)

Konfigurasi lengkap: [Configuration](/id/gateway/configuration)

Kunci top-level datar (`channels.zalo.botToken`, `channels.zalo.dmPolicy`, dan yang serupa) adalah shorthand single-account lama. Untuk config baru, gunakan `channels.zalo.accounts.<id>.*`. Kedua bentuk tetap didokumentasikan di sini karena keduanya ada dalam schema.

Opsi provider:

- `channels.zalo.enabled`: aktifkan/nonaktifkan startup kanal.
- `channels.zalo.botToken`: token bot dari Zalo Bot Platform.
- `channels.zalo.tokenFile`: baca token dari path file biasa. Symlink ditolak.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing).
- `channels.zalo.allowFrom`: allowlist DM (ID pengguna). `open` memerlukan `"*"`. Wizard akan meminta ID numerik.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (default: allowlist). Ada di config; lihat [Capabilities](#capabilities) dan [Access control (Groups)](#access-control-groups) untuk perilaku bot Marketplace saat ini.
- `channels.zalo.groupAllowFrom`: allowlist pengirim grup (ID pengguna). Menggunakan `allowFrom` sebagai fallback saat tidak disetel.
- `channels.zalo.mediaMaxMb`: batas media masuk/keluar (MB, default 5).
- `channels.zalo.webhookUrl`: aktifkan mode Webhook (HTTPS wajib).
- `channels.zalo.webhookSecret`: secret Webhook (8-256 karakter).
- `channels.zalo.webhookPath`: path Webhook pada server HTTP gateway.
- `channels.zalo.proxy`: URL proxy untuk permintaan API.

Opsi multi-akun:

- `channels.zalo.accounts.<id>.botToken`: token per akun.
- `channels.zalo.accounts.<id>.tokenFile`: file token reguler per akun. Symlink ditolak.
- `channels.zalo.accounts.<id>.name`: nama tampilan.
- `channels.zalo.accounts.<id>.enabled`: aktifkan/nonaktifkan akun.
- `channels.zalo.accounts.<id>.dmPolicy`: kebijakan DM per akun.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist per akun.
- `channels.zalo.accounts.<id>.groupPolicy`: kebijakan grup per akun. Ada di config; lihat [Capabilities](#capabilities) dan [Access control (Groups)](#access-control-groups) untuk perilaku bot Marketplace saat ini.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist pengirim grup per akun.
- `channels.zalo.accounts.<id>.webhookUrl`: URL Webhook per akun.
- `channels.zalo.accounts.<id>.webhookSecret`: secret Webhook per akun.
- `channels.zalo.accounts.<id>.webhookPath`: path Webhook per akun.
- `channels.zalo.accounts.<id>.proxy`: URL proxy per akun.

## Terkait

- [Channels Overview](/id/channels) — semua kanal yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan gate penyebutan
- [Channel Routing](/id/channels/channel-routing) — routing sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan hardening
