---
read_when:
    - Menjelaskan bagaimana pesan masuk menjadi balasan
    - Menjelaskan sesi, mode antrean, atau perilaku streaming
    - Mendokumentasikan visibilitas reasoning dan implikasi penggunaan
summary: Alur pesan, sesi, antrean, dan visibilitas reasoning
title: Pesan
x-i18n:
    generated_at: "2026-04-23T09:20:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4490d87835f44f703b45b29ad69878fec552caf81f4bd07d29614f71ee15cfb
    source_path: concepts/messages.md
    workflow: 15
---

# Pesan

Halaman ini merangkum bagaimana OpenClaw menangani pesan masuk, sesi, antrean,
streaming, dan visibilitas reasoning.

## Alur pesan (tingkat tinggi)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Tombol pengaturan utama ada di konfigurasi:

- `messages.*` untuk prefiks, antrean, dan perilaku grup.
- `agents.defaults.*` untuk default block streaming dan chunking.
- Override channel (`channels.whatsapp.*`, `channels.telegram.*`, dll.) untuk batas dan toggle streaming.

Lihat [Configuration](/id/gateway/configuration) untuk schema lengkap.

## Dedupe masuk

Channel dapat mengirim ulang pesan yang sama setelah reconnect. OpenClaw menyimpan
cache berumur pendek yang dikunci berdasarkan channel/account/peer/session/message id sehingga pengiriman
duplikat tidak memicu run agen lain.

## Debouncing masuk

Pesan berurutan yang cepat dari **pengirim yang sama** dapat digabungkan menjadi satu
giliran agen melalui `messages.inbound`. Debouncing dibatasi per channel + percakapan
dan menggunakan pesan terbaru untuk threading/id balasan.

Konfigurasi (default global + override per-channel):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Catatan:

- Debounce berlaku untuk pesan **hanya teks**; media/lampiran langsung di-flush.
- Perintah kontrol melewati debouncing agar tetap berdiri sendiri — **kecuali** saat sebuah channel secara eksplisit ikut serta dalam koalescing DM pengirim yang sama (misalnya [BlueBubbles `coalesceSameSenderDms`](/id/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), di mana perintah DM menunggu di dalam jendela debounce agar payload kirim-terpisah dapat bergabung ke giliran agen yang sama.

## Sesi dan perangkat

Sesi dimiliki oleh gateway, bukan oleh klien.

- Chat langsung digabungkan ke kunci sesi utama agen.
- Grup/channel mendapatkan kunci sesi mereka sendiri.
- Penyimpanan sesi dan transkrip berada di host gateway.

Beberapa perangkat/channel dapat dipetakan ke sesi yang sama, tetapi riwayat tidak sepenuhnya
disinkronkan kembali ke setiap klien. Rekomendasi: gunakan satu perangkat utama untuk percakapan panjang
agar menghindari konteks yang menyimpang. UI Control dan TUI selalu menampilkan
transkrip sesi berbasis gateway, sehingga keduanya menjadi sumber kebenaran.

Detail: [Session management](/id/concepts/session).

## Body masuk dan konteks riwayat

OpenClaw memisahkan **body prompt** dari **body perintah**:

- `Body`: teks prompt yang dikirim ke agen. Ini dapat mencakup envelope channel dan
  wrapper riwayat opsional.
- `CommandBody`: teks pengguna mentah untuk parsing directive/perintah.
- `RawBody`: alias lama untuk `CommandBody` (dipertahankan demi kompatibilitas).

Saat sebuah channel menyediakan riwayat, channel itu menggunakan wrapper bersama:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Untuk **chat non-langsung** (grup/channel/room), **body pesan saat ini** diberi prefiks dengan
label pengirim (gaya yang sama yang digunakan untuk entri riwayat). Ini menjaga pesan real-time dan antrean/riwayat
tetap konsisten dalam prompt agen.

Buffer riwayat bersifat **hanya pending**: buffer ini mencakup pesan grup yang _tidak_
memicu run (misalnya, pesan yang dibatasi mention) dan **tidak mencakup** pesan
yang sudah ada dalam transkrip sesi.

Penghapusan directive hanya berlaku pada bagian **pesan saat ini** sehingga riwayat
tetap utuh. Channel yang membungkus riwayat harus menetapkan `CommandBody` (atau
`RawBody`) ke teks pesan asli dan menjaga `Body` sebagai prompt gabungan.
Buffer riwayat dapat dikonfigurasi melalui `messages.groupChat.historyLimit` (default
global) dan override per-channel seperti `channels.slack.historyLimit` atau
`channels.telegram.accounts.<id>.historyLimit` (tetapkan `0` untuk menonaktifkan).

## Antrean dan tindak lanjut

Jika sebuah run sudah aktif, pesan masuk dapat dimasukkan ke antrean, diarahkan ke
run saat ini, atau dikumpulkan untuk giliran tindak lanjut.

- Konfigurasikan melalui `messages.queue` (dan `messages.queue.byChannel`).
- Mode: `interrupt`, `steer`, `followup`, `collect`, plus varian backlog.

Detail: [Queueing](/id/concepts/queue).

## Streaming, chunking, dan batching

Block streaming mengirim balasan parsial saat model menghasilkan blok teks.
Chunking mematuhi batas teks channel dan menghindari pemisahan fenced code.

Pengaturan utama:

- `agents.defaults.blockStreamingDefault` (`on|off`, default off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching berbasis idle)
- `agents.defaults.humanDelay` (jeda mirip manusia antarbalasan blok)
- Override channel: `*.blockStreaming` dan `*.blockStreamingCoalesce` (channel non-Telegram memerlukan `*.blockStreaming: true` eksplisit)

Detail: [Streaming + chunking](/id/concepts/streaming).

## Visibilitas reasoning dan token

OpenClaw dapat menampilkan atau menyembunyikan reasoning model:

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten reasoning tetap dihitung ke penggunaan token saat dihasilkan oleh model.
- Telegram mendukung streaming reasoning ke bubble draf.

Detail: [Thinking + reasoning directives](/id/tools/thinking) dan [Token use](/id/reference/token-use).

## Prefiks, threading, dan balasan

Pemformatan pesan keluar dipusatkan di `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, dan `channels.<channel>.accounts.<id>.responsePrefix` (cascade prefiks keluar), plus `channels.whatsapp.messagePrefix` (prefiks masuk WhatsApp)
- Threading balasan melalui `replyToMode` dan default per-channel

Detail: [Configuration](/id/gateway/configuration-reference#messages) dan dokumentasi channel.

## Balasan senyap

Token senyap persis `NO_REPLY` / `no_reply` berarti “jangan kirim balasan yang terlihat oleh pengguna”.
OpenClaw me-resolve perilaku tersebut berdasarkan jenis percakapan:

- Percakapan langsung tidak mengizinkan kesenyapan secara default dan menulis ulang
  balasan senyap kosong menjadi fallback terlihat yang singkat.
- Grup/channel mengizinkan kesenyapan secara default.
- Orkestrasi internal mengizinkan kesenyapan secara default.

Default ada di bawah `agents.defaults.silentReply` dan
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` dan
`surfaces.<id>.silentReplyRewrite` dapat menimpanya per surface.

Saat sesi induk memiliki satu atau lebih run subagen hasil spawn yang masih pending, balasan
senyap kosong dibuang pada semua surface alih-alih ditulis ulang, sehingga induk
tetap diam sampai event penyelesaian child mengirim balasan yang sebenarnya.

## Terkait

- [Streaming](/id/concepts/streaming) — pengiriman pesan real-time
- [Retry](/id/concepts/retry) — perilaku retry pengiriman pesan
- [Queue](/id/concepts/queue) — antrean pemrosesan pesan
- [Channels](/id/channels) — integrasi platform pesan
