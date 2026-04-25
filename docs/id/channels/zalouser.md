---
read_when:
    - Menyiapkan Zalo Personal untuk OpenClaw
    - Men-debug login atau alur pesan Zalo Personal
summary: Dukungan akun pribadi Zalo melalui zca-js native (login QR), kapabilitas, dan konfigurasi
title: Zalo pribadi
x-i18n:
    generated_at: "2026-04-25T13:42:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

Status: eksperimental. Integrasi ini mengotomatisasi **akun Zalo pribadi** melalui `zca-js` native di dalam OpenClaw.

> **Peringatan:** Ini adalah integrasi tidak resmi dan dapat menyebabkan akun ditangguhkan/diblokir. Gunakan dengan risiko Anda sendiri.

## Plugin bawaan

Zalo Personal tersedia sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Zalo Personal,
instal secara manual:

- Instal melalui CLI: `openclaw plugins install @openclaw/zalouser`
- Atau dari source checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detail: [Plugins](/id/tools/plugin)

Tidak diperlukan biner CLI `zca`/`openzca` eksternal.

## Penyiapan cepat (pemula)

1. Pastikan plugin Zalo Personal tersedia.
   - Rilis paket OpenClaw saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Login (QR, di mesin Gateway):
   - `openclaw channels login --channel zalouser`
   - Pindai kode QR dengan aplikasi seluler Zalo.
3. Aktifkan channel:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Mulai ulang Gateway (atau selesaikan penyiapan).
5. Akses DM secara default menggunakan pairing; setujui kode pairing saat kontak pertama.

## Apa ini

- Berjalan sepenuhnya in-process melalui `zca-js`.
- Menggunakan event listener native untuk menerima pesan masuk.
- Mengirim balasan langsung melalui API JS (teks/media/tautan).
- Dirancang untuk kasus penggunaan “akun pribadi” saat Zalo Bot API tidak tersedia.

## Penamaan

ID channel adalah `zalouser` untuk menegaskan bahwa ini mengotomatisasi **akun pengguna Zalo pribadi** (tidak resmi). Kami mempertahankan `zalo` untuk kemungkinan integrasi API resmi Zalo di masa mendatang.

## Menemukan ID (direktori)

Gunakan CLI direktori untuk menemukan peer/grup dan ID-nya:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Batasan

- Teks keluar dipotong menjadi bagian sekitar 2000 karakter (batas klien Zalo).
- Streaming diblokir secara default.

## Kontrol akses (DM)

`channels.zalouser.dmPolicy` mendukung: `pairing | allowlist | open | disabled` (default: `pairing`).

`channels.zalouser.allowFrom` menerima ID pengguna atau nama. Saat penyiapan, nama di-resolve menjadi ID menggunakan lookup kontak in-process plugin.

Setujui melalui:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Akses grup (opsional)

- Default: `channels.zalouser.groupPolicy = "open"` (grup diizinkan). Gunakan `channels.defaults.groupPolicy` untuk mengganti default saat tidak ditetapkan.
- Batasi ke allowlist dengan:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (kuncinya sebaiknya berupa ID grup yang stabil; nama di-resolve menjadi ID saat startup bila memungkinkan)
  - `channels.zalouser.groupAllowFrom` (mengontrol pengirim mana di grup yang diizinkan yang dapat memicu bot)
- Blokir semua grup: `channels.zalouser.groupPolicy = "disabled"`.
- Wizard konfigurasi dapat meminta allowlist grup.
- Saat startup, OpenClaw me-resolve nama grup/pengguna dalam allowlist menjadi ID dan mencatat pemetaannya.
- Pencocokan allowlist grup secara default hanya berdasarkan ID. Nama yang tidak berhasil di-resolve diabaikan untuk auth kecuali `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- `channels.zalouser.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas break-glass yang mengaktifkan kembali pencocokan nama grup yang dapat berubah.
- Jika `groupAllowFrom` tidak ditetapkan, runtime akan fallback ke `allowFrom` untuk pemeriksaan pengirim grup.
- Pemeriksaan pengirim berlaku untuk pesan grup normal maupun perintah kontrol (misalnya `/new`, `/reset`).

Contoh:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Mention gating grup

- `channels.zalouser.groups.<group>.requireMention` mengontrol apakah balasan grup memerlukan mention.
- Urutan resolusi: ID/nama grup persis -> slug grup yang dinormalisasi -> `*` -> default (`true`).
- Ini berlaku baik untuk grup yang ada di allowlist maupun mode grup open.
- Mengutip pesan bot dihitung sebagai mention implisit untuk aktivasi grup.
- Perintah kontrol yang diotorisasi (misalnya `/new`) dapat melewati mention gating.
- Saat pesan grup dilewati karena mention diperlukan, OpenClaw menyimpannya sebagai riwayat grup tertunda dan menyertakannya pada pesan grup berikutnya yang diproses.
- Batas riwayat grup default mengikuti `messages.groupChat.historyLimit` (fallback `50`). Anda dapat menggantinya per akun dengan `channels.zalouser.historyLimit`.

Contoh:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Multi-akun

Akun dipetakan ke profil `zalouser` dalam state OpenClaw. Contoh:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Mengetik, reaksi, dan pengakuan pengiriman

- OpenClaw mengirim peristiwa mengetik sebelum mengirim balasan (best-effort).
- Tindakan reaksi pesan `react` didukung untuk `zalouser` dalam tindakan channel.
  - Gunakan `remove: true` untuk menghapus emoji reaksi tertentu dari sebuah pesan.
  - Semantik reaksi: [Reactions](/id/tools/reactions)
- Untuk pesan masuk yang menyertakan metadata peristiwa, OpenClaw mengirim pengakuan delivered + seen (best-effort).

## Pemecahan masalah

**Login tidak bertahan:**

- `openclaw channels status --probe`
- Login ulang: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nama allowlist/grup tidak berhasil di-resolve:**

- Gunakan ID numerik dalam `allowFrom`/`groupAllowFrom`/`groups`, atau nama teman/grup yang persis.

**Di-upgrade dari penyiapan lama berbasis CLI:**

- Hapus asumsi proses `zca` eksternal lama.
- Channel sekarang berjalan sepenuhnya di dalam OpenClaw tanpa biner CLI eksternal.

## Terkait

- [Ringkasan Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku chat grup dan mention gating
- [Channel Routing](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Security](/id/gateway/security) — model akses dan penguatan
