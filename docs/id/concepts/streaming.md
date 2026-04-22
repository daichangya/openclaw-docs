---
read_when:
    - Menjelaskan cara kerja streaming atau chunking di channel
    - Mengubah perilaku block streaming atau chunking channel
    - Men-debug balasan blok duplikat/terlalu dini atau streaming pratinjau channel
summary: Perilaku streaming + chunking (balasan blok, streaming pratinjau channel, pemetaan mode)
title: Streaming dan Chunking
x-i18n:
    generated_at: "2026-04-22T04:21:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6b246025ea1b1be57705bde60c0cdb485ffda727392cf00ea5a165571e37fce
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

OpenClaw memiliki dua lapisan streaming yang terpisah:

- **Block streaming (channel):** mengirim **blok** yang sudah selesai saat assistant menulis. Ini adalah pesan channel normal (bukan token delta).
- **Preview streaming (Telegram/Discord/Slack):** memperbarui **pesan pratinjau** sementara selama proses pembuatan.

Saat ini **tidak ada true token-delta streaming** ke pesan channel. Preview streaming berbasis pesan (kirim + edit/tambahkan).

## Block streaming (pesan channel)

Block streaming mengirim output assistant dalam potongan besar saat output tersedia.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Legenda:

- `text_delta/events`: event stream model (mungkin jarang untuk model non-streaming).
- `chunker`: `EmbeddedBlockChunker` yang menerapkan batas min/max + preferensi pemisahan.
- `channel send`: pesan outbound aktual (balasan blok).

**Kontrol:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (default off).
- Override channel: `*.blockStreaming` (dan varian per akun) untuk memaksa `"on"`/`"off"` per channel.
- `agents.defaults.blockStreamingBreak`: `"text_end"` atau `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gabungkan blok stream sebelum pengiriman).
- Batas keras channel: `*.textChunkLimit` (misalnya `channels.whatsapp.textChunkLimit`).
- Mode chunk channel: `*.chunkMode` (`length` default, `newline` memisahkan pada baris kosong (batas paragraf) sebelum chunking berdasarkan panjang).
- Batas lunak Discord: `channels.discord.maxLinesPerMessage` (default 17) memisahkan balasan tinggi untuk menghindari clipping UI.

**Semantik batas:**

- `text_end`: stream blok segera setelah chunker mengeluarkan blok; flush pada setiap `text_end`.
- `message_end`: tunggu hingga pesan assistant selesai, lalu flush output yang di-buffer.

`message_end` tetap menggunakan chunker jika teks yang di-buffer melebihi `maxChars`, sehingga bisa mengeluarkan beberapa chunk di akhir.

## Algoritma chunking (batas rendah/tinggi)

Block chunking diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas rendah:** jangan keluarkan apa pun sampai buffer >= `minChars` (kecuali dipaksa).
- **Batas tinggi:** utamakan pemisahan sebelum `maxChars`; jika dipaksa, pisahkan tepat di `maxChars`.
- **Preferensi pemisahan:** `paragraph` → `newline` → `sentence` → `whitespace` → pemisahan keras.
- **Code fence:** jangan pernah memisah di dalam fence; saat dipaksa di `maxChars`, tutup + buka kembali fence agar Markdown tetap valid.

`maxChars` dibatasi ke `textChunkLimit` channel, jadi Anda tidak dapat melampaui batas per channel.

## Coalescing (menggabungkan blok stream)

Saat block streaming diaktifkan, OpenClaw dapat **menggabungkan chunk blok berurutan**
sebelum mengirimnya. Ini mengurangi “spam satu baris” sambil tetap memberikan
output progresif.

- Coalescing menunggu **jeda idle** (`idleMs`) sebelum flush.
- Buffer dibatasi oleh `maxChars` dan akan flush jika melebihinya.
- `minChars` mencegah fragmen kecil terkirim sampai teks cukup terkumpul
  (flush final selalu mengirim teks yang tersisa).
- Joiner diturunkan dari `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spasi).
- Override channel tersedia melalui `*.blockStreamingCoalesce` (termasuk config per akun).
- Default coalesce `minChars` dinaikkan ke 1500 untuk Signal/Slack/Discord kecuali dioverride.

## Jeda bergaya manusia antarblok

Saat block streaming diaktifkan, Anda dapat menambahkan **jeda acak** di antara
balasan blok (setelah blok pertama). Ini membuat respons multi-gelembung terasa
lebih alami.

- Config: `agents.defaults.humanDelay` (override per agen melalui `agents.list[].humanDelay`).
- Mode: `off` (default), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Hanya berlaku untuk **balasan blok**, bukan balasan final atau ringkasan tool.

## "Stream chunks or everything"

Ini dipetakan ke:

- **Stream chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (kirim saat berjalan). Channel non-Telegram juga memerlukan `*.blockStreaming: true`.
- **Stream everything at end:** `blockStreamingBreak: "message_end"` (flush sekali, mungkin menjadi beberapa chunk jika sangat panjang).
- **No block streaming:** `blockStreamingDefault: "off"` (hanya balasan final).

**Catatan channel:** Block streaming **nonaktif kecuali**
`*.blockStreaming` secara eksplisit diatur ke `true`. Channel dapat melakukan stream pratinjau langsung
(`channels.<channel>.streaming`) tanpa balasan blok.

Pengingat lokasi config: default `blockStreaming*` berada di bawah
`agents.defaults`, bukan di root config.

## Mode preview streaming

Key kanonis: `channels.<channel>.streaming`

Mode:

- `off`: nonaktifkan preview streaming.
- `partial`: satu pratinjau yang diganti dengan teks terbaru.
- `block`: pembaruan pratinjau dalam langkah bertahap/chunk yang ditambahkan.
- `progress`: pratinjau progres/status selama pembuatan, jawaban final saat selesai.

### Pemetaan channel

| Channel    | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | dipetakan ke `partial` |
| Discord    | ✅    | ✅        | ✅      | dipetakan ke `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Khusus Slack:

- `channels.slack.streaming.nativeTransport` mengaktifkan/nonaktifkan panggilan API streaming native Slack saat `channels.slack.streaming.mode="partial"` (default: `true`).
- Streaming native Slack dan status thread assistant Slack memerlukan target reply thread; DM tingkat atas tidak menampilkan pratinjau bergaya thread tersebut.

Migrasi key legacy:

- Telegram: `streamMode` + boolean `streaming` dimigrasikan otomatis ke enum `streaming`.
- Discord: `streamMode` + boolean `streaming` dimigrasikan otomatis ke enum `streaming`.
- Slack: `streamMode` dimigrasikan otomatis ke `streaming.mode`; boolean `streaming` dimigrasikan otomatis ke `streaming.mode` plus `streaming.nativeTransport`; `nativeStreaming` legacy dimigrasikan otomatis ke `streaming.nativeTransport`.

### Perilaku runtime

Telegram:

- Menggunakan pembaruan pratinjau `sendMessage` + `editMessageText` di DM dan grup/topik.
- Preview streaming dilewati saat block streaming Telegram diaktifkan secara eksplisit (untuk menghindari streaming ganda).
- `/reasoning stream` dapat menulis reasoning ke pratinjau.

Discord:

- Menggunakan kirim + edit pesan pratinjau.
- Mode `block` menggunakan draft chunking (`draftChunk`).
- Preview streaming dilewati saat block streaming Discord diaktifkan secara eksplisit.
- Payload final media, error, dan explicit-reply membatalkan pratinjau yang tertunda tanpa flush draf baru, lalu menggunakan pengiriman normal.

Slack:

- `partial` dapat menggunakan streaming native Slack (`chat.startStream`/`append`/`stop`) saat tersedia.
- `block` menggunakan pratinjau draf gaya append.
- `progress` menggunakan teks pratinjau status, lalu jawaban final.
- Payload final media/error dan final progres tidak membuat pesan draf sementara yang terbuang; hanya final teks/blok yang dapat mengedit pratinjau yang mem-flush teks draf tertunda.

Mattermost:

- Melakukan stream thinking, aktivitas tool, dan teks balasan parsial ke satu post pratinjau draf yang difinalisasi di tempat saat jawaban final aman untuk dikirim.
- Fallback ke pengiriman post final baru jika post pratinjau dihapus atau tidak tersedia saat waktu finalisasi.
- Payload final media/error membatalkan pembaruan pratinjau yang tertunda sebelum pengiriman normal alih-alih mem-flush post pratinjau sementara.

Matrix:

- Pratinjau draf difinalisasi di tempat saat teks final dapat menggunakan kembali event pratinjau.
- Final khusus media, error, dan ketidakcocokan target balasan membatalkan pembaruan pratinjau yang tertunda sebelum pengiriman normal; pratinjau usang yang sudah terlihat akan di-redact.

### Pembaruan pratinjau progres tool

Preview streaming juga dapat menyertakan pembaruan **tool-progress** — baris status singkat seperti "mencari di web", "membaca file", atau "memanggil tool" — yang muncul dalam pesan pratinjau yang sama saat tool sedang berjalan, sebelum balasan final. Ini menjaga giliran tool multi-langkah tetap terlihat hidup secara visual, alih-alih hening antara pratinjau thinking pertama dan jawaban final.

Permukaan yang didukung:

- **Discord**, **Slack**, dan **Telegram** melakukan stream tool-progress ke edit pratinjau langsung.
- **Mattermost** sudah menggabungkan aktivitas tool ke dalam satu post pratinjau drafnya (lihat di atas).
- Edit tool-progress mengikuti mode preview streaming yang aktif; edit ini dilewati saat preview streaming `off` atau saat block streaming telah mengambil alih pesan.

## Terkait

- [Messages](/id/concepts/messages) — siklus hidup pesan dan pengiriman
- [Retry](/id/concepts/retry) — perilaku retry saat pengiriman gagal
- [Channels](/id/channels) — dukungan streaming per channel
