---
read_when:
    - Menyiapkan Zalo Pribadi untuk OpenClaw
    - Men-debug login atau alur pesan Zalo Pribadi
summary: Dukungan akun pribadi Zalo melalui zca-js native (login QR), kemampuan, dan konfigurasi
title: Zalo Pribadi
x-i18n:
    generated_at: "2026-04-07T09:12:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08f50edb2f4c6fe24972efe5e321f5fd0572c7d29af5c1db808151c7c943dc66
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Pribadi (tidak resmi)

Status: eksperimental. Integrasi ini mengotomatiskan **akun Zalo pribadi** melalui `zca-js` native di dalam OpenClaw.

> **Peringatan:** Ini adalah integrasi tidak resmi dan dapat menyebabkan penangguhan/pemblokiran akun. Gunakan dengan risiko Anda sendiri.

## Plugin bawaan

Zalo Personal dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi build paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Zalo Personal,
instal secara manual:

- Instal melalui CLI: `openclaw plugins install @openclaw/zalouser`
- Atau dari checkout source: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detail: [Plugins](/id/tools/plugin)

Tidak diperlukan biner CLI `zca`/`openzca` eksternal.

## Penyiapan cepat (pemula)

1. Pastikan plugin Zalo Personal tersedia.
   - Rilis OpenClaw terkemas saat ini sudah menyertakannya.
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
5. Akses DM default-nya adalah pairing; setujui kode pairing saat kontak pertama.

## Apa ini

- Berjalan sepenuhnya in-process melalui `zca-js`.
- Menggunakan event listener native untuk menerima pesan masuk.
- Mengirim balasan langsung melalui API JS (teks/media/tautan).
- Dirancang untuk kasus penggunaan “akun pribadi” saat API Bot Zalo tidak tersedia.

## Penamaan

ID channel adalah `zalouser` untuk memperjelas bahwa ini mengotomatiskan **akun pengguna Zalo pribadi** (tidak resmi). Kami mempertahankan `zalo` untuk kemungkinan integrasi API Zalo resmi di masa depan.

## Menemukan ID (direktori)

Gunakan CLI direktori untuk menemukan peer/grup dan ID-nya:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Batasan

- Teks keluar dipecah menjadi sekitar 2000 karakter (batas klien Zalo).
- Streaming diblokir secara default.

## Kontrol akses (DM)

`channels.zalouser.dmPolicy` mendukung: `pairing | allowlist | open | disabled` (default: `pairing`).

`channels.zalouser.allowFrom` menerima ID pengguna atau nama. Selama penyiapan, nama diselesaikan menjadi ID menggunakan pencarian kontak in-process milik plugin.

Setujui melalui:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Akses grup (opsional)

- Default: `channels.zalouser.groupPolicy = "open"` (grup diizinkan). Gunakan `channels.defaults.groupPolicy` untuk menimpa default saat tidak disetel.
- Batasi ke allowlist dengan:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (kunci sebaiknya berupa ID grup yang stabil; nama diselesaikan menjadi ID saat startup jika memungkinkan)
  - `channels.zalouser.groupAllowFrom` (mengontrol pengirim mana dalam grup yang diizinkan dapat memicu bot)
- Blokir semua grup: `channels.zalouser.groupPolicy = "disabled"`.
- Wizard konfigurasi dapat meminta allowlist grup.
- Saat startup, OpenClaw menyelesaikan nama grup/pengguna dalam allowlist menjadi ID dan mencatat pemetaannya.
- Pencocokan allowlist grup secara default berbasis ID saja. Nama yang tidak terselesaikan diabaikan untuk auth kecuali `channels.zalouser.dangerouslyAllowNameMatching: true` diaktifkan.
- `channels.zalouser.dangerouslyAllowNameMatching: true` adalah mode kompatibilitas break-glass yang mengaktifkan kembali pencocokan nama grup yang dapat berubah.
- Jika `groupAllowFrom` tidak disetel, runtime menggunakan `allowFrom` sebagai fallback untuk pemeriksaan pengirim grup.
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

### Pembatasan mention grup

- `channels.zalouser.groups.<group>.requireMention` mengontrol apakah balasan grup memerlukan mention.
- Urutan resolusi: id/nama grup persis -> slug grup ternormalisasi -> `*` -> default (`true`).
- Ini berlaku baik untuk grup yang masuk allowlist maupun mode grup terbuka.
- Mengutip pesan bot dihitung sebagai mention implisit untuk aktivasi grup.
- Perintah kontrol yang diotorisasi (misalnya `/new`) dapat melewati pembatasan mention.
- Saat pesan grup dilewati karena mention diperlukan, OpenClaw menyimpannya sebagai riwayat grup tertunda dan menyertakannya pada pesan grup berikutnya yang diproses.
- Batas riwayat grup secara default adalah `messages.groupChat.historyLimit` (fallback `50`). Anda dapat menimpa per akun dengan `channels.zalouser.historyLimit`.

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

- OpenClaw mengirim event mengetik sebelum mengirim balasan (best-effort).
- Aksi reaksi pesan `react` didukung untuk `zalouser` dalam aksi channel.
  - Gunakan `remove: true` untuk menghapus emoji reaksi tertentu dari sebuah pesan.
  - Semantik reaksi: [Reactions](/id/tools/reactions)
- Untuk pesan masuk yang menyertakan metadata event, OpenClaw mengirim pengakuan delivered + seen (best-effort).

## Pemecahan masalah

**Login tidak tersimpan:**

- `openclaw channels status --probe`
- Login ulang: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Nama allowlist/grup tidak terselesaikan:**

- Gunakan ID numerik di `allowFrom`/`groupAllowFrom`/`groups`, atau nama teman/grup yang persis.

**Di-upgrade dari penyiapan lama berbasis CLI:**

- Hapus asumsi proses `zca` eksternal lama.
- Channel sekarang berjalan sepenuhnya di OpenClaw tanpa biner CLI eksternal.

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
