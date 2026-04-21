---
read_when:
    - Menjelaskan bagaimana pesan masuk menjadi balasan
    - Menjelaskan sesi, mode antrean, atau perilaku streaming
    - Mendokumentasikan visibilitas penalaran dan implikasi penggunaannya
summary: Alur pesan, sesi, antrean, dan visibilitas penalaran
title: Pesan
x-i18n:
    generated_at: "2026-04-21T09:17:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f535d01872e7fcf0f3d99a5c5ac01feddbf7fb562ff61d9ccdf18f109f9922f
    source_path: concepts/messages.md
    workflow: 15
---

# Pesan

Halaman ini menghubungkan cara OpenClaw menangani pesan masuk, sesi, antrean,
streaming, dan visibilitas penalaran.

## Alur pesan (tingkat tinggi)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Pengaturan utama ada di konfigurasi:

- `messages.*` untuk prefiks, antrean, dan perilaku grup.
- `agents.defaults.*` untuk default block streaming dan chunking.
- Override channel (`channels.whatsapp.*`, `channels.telegram.*`, dll.) untuk batas dan toggle streaming.

Lihat [Configuration](/id/gateway/configuration) untuk skema lengkap.

## Deduplikasi pesan masuk

Channel dapat mengirim ulang pesan yang sama setelah reconnect. OpenClaw menyimpan
cache berumur pendek yang dikunci oleh channel/account/peer/session/message id sehingga pengiriman
duplikat tidak memicu agent run lain.

## Debouncing pesan masuk

Pesan cepat berurutan dari **pengirim yang sama** dapat dibatch menjadi satu
giliran agen melalui `messages.inbound`. Debouncing dicakup per channel + percakapan
dan menggunakan pesan terbaru untuk threading/ID balasan.

Konfigurasi (default global + override per channel):

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

- Debounce berlaku untuk pesan **teks saja**; media/lampiran langsung di-flush.
- Perintah kontrol melewati debouncing agar tetap berdiri sendiri — **kecuali** ketika sebuah channel secara eksplisit memilih ikut serta dalam koalesensi DM pengirim-sama (misalnya [BlueBubbles `coalesceSameSenderDms`](/id/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), di mana perintah DM menunggu di dalam jendela debounce agar payload kirim-terpisah dapat bergabung ke giliran agen yang sama.

## Sesi dan device

Sesi dimiliki oleh gateway, bukan oleh klien.

- Chat langsung digabungkan ke session key utama agen.
- Grup/channel mendapatkan session key mereka sendiri.
- Penyimpanan sesi dan transkrip berada di host gateway.

Beberapa device/channel dapat dipetakan ke sesi yang sama, tetapi riwayat tidak sepenuhnya
disinkronkan kembali ke setiap klien. Rekomendasi: gunakan satu device utama untuk percakapan panjang
agar konteks tidak menyimpang. Control UI dan TUI selalu menampilkan
transkrip sesi yang didukung gateway, sehingga menjadi sumber kebenaran.

Detail: [Session management](/id/concepts/session).

## Body masuk dan konteks riwayat

OpenClaw memisahkan **prompt body** dari **command body**:

- `Body`: teks prompt yang dikirim ke agen. Ini dapat mencakup envelope channel dan
  wrapper riwayat opsional.
- `CommandBody`: teks pengguna mentah untuk parsing directive/perintah.
- `RawBody`: alias lama untuk `CommandBody` (dipertahankan demi kompatibilitas).

Ketika sebuah channel menyediakan riwayat, channel tersebut menggunakan wrapper bersama:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Untuk **chat non-langsung** (grup/channel/room), **body pesan saat ini** diawali dengan
label pengirim (gaya yang sama seperti yang digunakan untuk entri riwayat). Ini menjaga konsistensi
pesan real-time dan pesan antrean/riwayat dalam prompt agen.

Buffer riwayat hanya **pending-only**: buffer ini mencakup pesan grup yang _tidak_
memicu sebuah run (misalnya, pesan yang disaring oleh mention gating) dan **tidak mencakup** pesan
yang sudah ada dalam transkrip sesi.

Penghapusan directive hanya berlaku pada bagian **pesan saat ini** sehingga riwayat
tetap utuh. Channel yang membungkus riwayat harus menetapkan `CommandBody` (atau
`RawBody`) ke teks pesan asli dan mempertahankan `Body` sebagai prompt gabungan.
Buffer riwayat dapat dikonfigurasi melalui `messages.groupChat.historyLimit` (default
global) dan override per channel seperti `channels.slack.historyLimit` atau
`channels.telegram.accounts.<id>.historyLimit` (atur `0` untuk menonaktifkan).

## Antrean dan tindak lanjut

Jika sebuah run sudah aktif, pesan masuk dapat dimasukkan ke antrean, diarahkan ke
run saat ini, atau dikumpulkan untuk giliran tindak lanjut.

- Konfigurasikan melalui `messages.queue` (dan `messages.queue.byChannel`).
- Mode: `interrupt`, `steer`, `followup`, `collect`, ditambah varian backlog.

Detail: [Queueing](/id/concepts/queue).

## Streaming, chunking, dan batching

Block streaming mengirim balasan parsial saat model menghasilkan blok teks.
Chunking menghormati batas teks channel dan menghindari pemisahan fenced code.

Pengaturan utama:

- `agents.defaults.blockStreamingDefault` (`on|off`, default off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching berbasis idle)
- `agents.defaults.humanDelay` (jeda mirip manusia di antara balasan blok)
- Override channel: `*.blockStreaming` dan `*.blockStreamingCoalesce` (channel non-Telegram memerlukan `*.blockStreaming: true` secara eksplisit)

Detail: [Streaming + chunking](/id/concepts/streaming).

## Visibilitas penalaran dan token

OpenClaw dapat menampilkan atau menyembunyikan penalaran model:

- `/reasoning on|off|stream` mengontrol visibilitas.
- Konten penalaran tetap dihitung dalam penggunaan token ketika dihasilkan oleh model.
- Telegram mendukung streaming penalaran ke bubble draf.

Detail: [Thinking + reasoning directives](/id/tools/thinking) dan [Token use](/id/reference/token-use).

## Prefiks, threading, dan balasan

Pemformatan pesan keluar dipusatkan dalam `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, dan `channels.<channel>.accounts.<id>.responsePrefix` (cascade prefiks keluar), plus `channels.whatsapp.messagePrefix` (prefiks masuk WhatsApp)
- Reply threading melalui `replyToMode` dan default per channel

Detail: [Configuration](/id/gateway/configuration-reference#messages) dan dokumentasi channel.

## Balasan senyap

Token senyap persis `NO_REPLY` / `no_reply` berarti “jangan kirim balasan yang terlihat oleh pengguna”.
OpenClaw menyelesaikan perilaku itu berdasarkan jenis percakapan:

- Percakapan langsung tidak mengizinkan senyap secara default dan menulis ulang balasan
  senyap murni menjadi fallback singkat yang terlihat.
- Grup/channel mengizinkan senyap secara default.
- Orkestrasi internal mengizinkan senyap secara default.

Default berada di bawah `agents.defaults.silentReply` dan
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` dan
`surfaces.<id>.silentReplyRewrite` dapat meng-override keduanya per surface.

## Terkait

- [Streaming](/id/concepts/streaming) — pengiriman pesan real-time
- [Retry](/id/concepts/retry) — perilaku retry pengiriman pesan
- [Queue](/id/concepts/queue) — antrean pemrosesan pesan
- [Channels](/id/channels) — integrasi platform perpesanan
