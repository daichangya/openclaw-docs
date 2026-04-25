---
read_when:
    - Men-debug atau mengonfigurasi akses WebChat
summary: Host statis WebChat local loopback dan penggunaan Gateway WS untuk UI chat
title: WebChat
x-i18n:
    generated_at: "2026-04-25T13:59:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

Status: UI chat SwiftUI macOS/iOS berbicara langsung ke WebSocket Gateway.

## Apa itu

- UI chat native untuk gateway (tanpa browser tersemat dan tanpa server statis lokal).
- Menggunakan sesi dan aturan perutean yang sama seperti channel lain.
- Perutean deterministik: balasan selalu kembali ke WebChat.

## Mulai cepat

1. Mulai gateway.
2. Buka UI WebChat (aplikasi macOS/iOS) atau tab chat Control UI.
3. Pastikan jalur auth gateway yang valid sudah dikonfigurasi (shared-secret secara default,
   bahkan pada local loopback).

## Cara kerjanya (perilaku)

- UI terhubung ke WebSocket Gateway dan menggunakan `chat.history`, `chat.send`, dan `chat.inject`.
- `chat.history` dibatasi untuk stabilitas: Gateway dapat memotong field teks panjang, menghilangkan metadata berat, dan mengganti entri yang terlalu besar dengan `[chat.history omitted: message too large]`.
- `chat.history` juga dinormalisasi untuk tampilan: konteks OpenClaw khusus runtime,
  wrapper envelope masuk, tag directive pengiriman inline
  seperti `[[reply_to_*]]` dan `[[audio_as_voice]]`, payload XML tool-call teks biasa
  (termasuk `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong), serta
  token kontrol model ASCII/full-width yang bocor dihapus dari teks yang terlihat,
  dan entri asisten yang seluruh teks terlihatnya hanya token diam persis
  `NO_REPLY` / `no_reply` dihilangkan.
- `chat.inject` menambahkan catatan asisten langsung ke transkrip dan menyiarkannya ke UI (tanpa agent run).
- Run yang dibatalkan dapat membuat output asisten parsial tetap terlihat di UI.
- Gateway menyimpan teks asisten parsial yang dibatalkan ke riwayat transkrip saat output yang dibuffer ada, dan menandai entri tersebut dengan metadata pembatalan.
- Riwayat selalu diambil dari gateway (tanpa pemantauan file lokal).
- Jika gateway tidak dapat dijangkau, WebChat menjadi read-only.

## Panel tools agen di Control UI

- Panel Tools `/agents` di Control UI memiliki dua tampilan terpisah:
  - **Tersedia Saat Ini** menggunakan `tools.effective(sessionKey=...)` dan menunjukkan apa yang benar-benar
    dapat digunakan sesi saat ini saat runtime, termasuk tool inti, Plugin, dan tool milik channel.
  - **Konfigurasi Tool** menggunakan `tools.catalog` dan tetap berfokus pada profil, override, dan
    semantik katalog.
- Ketersediaan runtime dicakup ke sesi. Berpindah sesi pada agen yang sama dapat mengubah daftar
  **Tersedia Saat Ini**.
- Editor config tidak menyiratkan ketersediaan runtime; akses efektif tetap mengikuti prioritas kebijakan
  (`allow`/`deny`, override per-agent dan penyedia/channel).

## Penggunaan remote

- Mode remote menyalurkan WebSocket gateway melalui SSH/Tailscale.
- Anda tidak perlu menjalankan server WebChat terpisah.

## Referensi konfigurasi (WebChat)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi WebChat:

- `gateway.webchat.chatHistoryMaxChars`: jumlah karakter maksimum untuk field teks dalam respons `chat.history`. Saat entri transkrip melebihi batas ini, Gateway memotong field teks panjang dan dapat mengganti pesan yang terlalu besar dengan placeholder. `maxChars` per-permintaan juga dapat dikirim oleh klien untuk menimpa default ini untuk satu panggilan `chat.history`.

Opsi global terkait:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  auth WebSocket shared-secret.
- `gateway.auth.allowTailscale`: tab chat browser Control UI dapat menggunakan header identitas Tailscale
  Serve saat diaktifkan.
- `gateway.auth.mode: "trusted-proxy"`: auth reverse-proxy untuk klien browser di belakang sumber proxy **non-loopback** yang sadar identitas (lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target gateway remote.
- `session.*`: penyimpanan sesi dan default main key.

## Terkait

- [Control UI](/id/web/control-ui)
- [Dashboard](/id/web/dashboard)
