---
read_when:
    - Menjelaskan cara kerja streaming atau chunking di channels
    - Mengubah perilaku streaming blok atau chunking kanal
    - Men-debug balasan blok yang duplikat/terlalu awal atau streaming pratinjau kanal
summary: Perilaku streaming + chunking (balasan blok, streaming pratinjau kanal, pemetaan mode)
title: Streaming dan chunking
x-i18n:
    generated_at: "2026-04-25T13:45:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw memiliki dua lapisan streaming yang terpisah:

- **Streaming blok (kanal):** memancarkan **blok** yang sudah selesai saat asisten menulis. Ini adalah pesan kanal normal (bukan delta token).
- **Streaming pratinjau (Telegram/Discord/Slack):** memperbarui **pesan pratinjau** sementara selama pembuatan.

Saat ini **tidak ada streaming delta-token sejati** ke pesan kanal. Streaming pratinjau berbasis pesan (kirim + edit/tambahkan).

## Streaming blok (pesan kanal)

Streaming blok mengirim output asisten dalam potongan kasar saat output itu tersedia.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Keterangan:

- `text_delta/events`: event stream model (dapat jarang untuk model non-streaming).
- `chunker`: `EmbeddedBlockChunker` yang menerapkan batas min/maks + preferensi pemisahan.
- `channel send`: pesan outbound aktual (balasan blok).

**Kontrol:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (default mati).
- Override kanal: `*.blockStreaming` (dan varian per-akun) untuk memaksa `"on"`/`"off"` per kanal.
- `agents.defaults.blockStreamingBreak`: `"text_end"` atau `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (gabungkan blok yang di-stream sebelum dikirim).
- Batas keras kanal: `*.textChunkLimit` (misalnya `channels.whatsapp.textChunkLimit`).
- Mode chunk kanal: `*.chunkMode` (`length` default, `newline` membagi pada baris kosong (batas paragraf) sebelum chunking berdasarkan panjang).
- Batas lunak Discord: `channels.discord.maxLinesPerMessage` (default 17) membagi balasan tinggi untuk menghindari pemotongan UI.

**Semantik batas:**

- `text_end`: stream blok segera setelah chunker memancarkan; flush pada setiap `text_end`.
- `message_end`: tunggu sampai pesan asisten selesai, lalu flush output yang dibuffer.

`message_end` tetap menggunakan chunker jika teks yang dibuffer melebihi `maxChars`, sehingga dapat memancarkan beberapa chunk di akhir.

### Pengiriman media dengan streaming blok

Direktif `MEDIA:` adalah metadata pengiriman normal. Saat streaming blok mengirim
blok media lebih awal, OpenClaw mengingat pengiriman itu untuk giliran tersebut. Jika payload
asisten akhir mengulangi URL media yang sama, pengiriman akhir akan menghapus
media duplikat alih-alih mengirim lampiran lagi.

Payload akhir yang duplikat persis ditekan. Jika payload akhir menambahkan
teks berbeda di sekitar media yang sudah di-stream, OpenClaw tetap mengirim
teks baru sambil menjaga media tetap dikirim sekali saja. Ini mencegah duplikasi voice note
atau file di kanal seperti Telegram ketika agen memancarkan `MEDIA:` selama
streaming dan provider juga menyertakannya dalam balasan yang telah selesai.

## Algoritme chunking (batas rendah/tinggi)

Chunking blok diimplementasikan oleh `EmbeddedBlockChunker`:

- **Batas rendah:** jangan pancarkan sampai buffer >= `minChars` (kecuali dipaksa).
- **Batas tinggi:** utamakan pemisahan sebelum `maxChars`; jika dipaksa, pisahkan pada `maxChars`.
- **Preferensi pemisahan:** `paragraph` → `newline` → `sentence` → `whitespace` → pemisahan keras.
- **Code fence:** jangan pernah membagi di dalam fence; saat dipaksa pada `maxChars`, tutup + buka kembali fence agar Markdown tetap valid.

`maxChars` dijepit ke `textChunkLimit` kanal, sehingga Anda tidak dapat melampaui batas per kanal.

## Coalescing (gabungkan blok yang di-stream)

Saat streaming blok diaktifkan, OpenClaw dapat **menggabungkan chunk blok berurutan**
sebelum mengirimkannya. Ini mengurangi “spam satu baris” sambil tetap memberikan
output progresif.

- Coalescing menunggu **jeda idle** (`idleMs`) sebelum flush.
- Buffer dibatasi oleh `maxChars` dan akan flush jika melebihinya.
- `minChars` mencegah fragmen kecil dikirim sampai cukup teks terkumpul
  (flush akhir selalu mengirim sisa teks).
- Joiner diturunkan dari `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → spasi).
- Override kanal tersedia melalui `*.blockStreamingCoalesce` (termasuk config per-akun).
- Default coalesce `minChars` dinaikkan menjadi 1500 untuk Signal/Slack/Discord kecuali dioverride.

## Jeda mirip manusia antar blok

Saat streaming blok diaktifkan, Anda dapat menambahkan **jeda acak** antar
balasan blok (setelah blok pertama). Ini membuat respons multi-gelembung terasa
lebih alami.

- Config: `agents.defaults.humanDelay` (override per agen melalui `agents.list[].humanDelay`).
- Mode: `off` (default), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Hanya berlaku untuk **balasan blok**, bukan balasan akhir atau ringkasan tool.

## "Stream chunks or everything"

Ini dipetakan ke:

- **Stream chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (pancarkan saat berjalan). Kanal selain Telegram juga memerlukan `*.blockStreaming: true`.
- **Stream everything at end:** `blockStreamingBreak: "message_end"` (flush sekali, mungkin beberapa chunk jika sangat panjang).
- **No block streaming:** `blockStreamingDefault: "off"` (hanya balasan akhir).

**Catatan kanal:** Streaming blok **mati kecuali**
`*.blockStreaming` secara eksplisit disetel ke `true`. Kanal dapat men-stream pratinjau live
(`channels.<channel>.streaming`) tanpa balasan blok.

Pengingat lokasi config: default `blockStreaming*` berada di bawah
`agents.defaults`, bukan root config.

## Mode streaming pratinjau

Kunci kanonis: `channels.<channel>.streaming`

Mode:

- `off`: nonaktifkan streaming pratinjau.
- `partial`: satu pratinjau yang diganti dengan teks terbaru.
- `block`: pembaruan pratinjau dalam langkah berpotongan/bertambah.
- `progress`: pratinjau progres/status selama pembuatan, jawaban akhir saat selesai.

### Pemetaan kanal

| Kanal      | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | dipetakan ke `partial` |
| Discord    | ✅    | ✅        | ✅      | dipetakan ke `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Khusus Slack:

- `channels.slack.streaming.nativeTransport` mengalihkan panggilan API streaming native Slack saat `channels.slack.streaming.mode="partial"` (default: `true`).
- Streaming native Slack dan status thread asisten Slack memerlukan target thread balasan; DM level atas tidak menampilkan pratinjau bergaya thread itu.

Migrasi kunci lama:

- Telegram: nilai lama `streamMode` dan `streaming` skalar/boolean dideteksi dan dimigrasikan oleh jalur kompatibilitas doctor/config ke `streaming.mode`.
- Discord: `streamMode` + `streaming` boolean dimigrasikan otomatis ke enum `streaming`.
- Slack: `streamMode` dimigrasikan otomatis ke `streaming.mode`; `streaming` boolean dimigrasikan otomatis ke `streaming.mode` plus `streaming.nativeTransport`; `nativeStreaming` lama dimigrasikan otomatis ke `streaming.nativeTransport`.

### Perilaku runtime

Telegram:

- Menggunakan pembaruan pratinjau `sendMessage` + `editMessageText` di DM maupun grup/topik.
- Streaming pratinjau dilewati saat streaming blok Telegram diaktifkan secara eksplisit (untuk menghindari streaming ganda).
- `/reasoning stream` dapat menulis reasoning ke pratinjau.

Discord:

- Menggunakan pesan pratinjau kirim + edit.
- Mode `block` menggunakan chunking draf (`draftChunk`).
- Streaming pratinjau dilewati saat streaming blok Discord diaktifkan secara eksplisit.
- Payload media akhir, error, dan balasan eksplisit membatalkan pratinjau tertunda tanpa flush draf baru, lalu menggunakan pengiriman normal.

Slack:

- `partial` dapat menggunakan streaming native Slack (`chat.startStream`/`append`/`stop`) saat tersedia.
- `block` menggunakan pratinjau draf gaya append.
- `progress` menggunakan teks pratinjau status, lalu jawaban akhir.
- Streaming pratinjau native dan draf menekan balasan blok untuk giliran itu, sehingga balasan Slack di-stream hanya melalui satu jalur pengiriman.
- Payload akhir media/error dan final progress tidak membuat pesan draf sekali pakai; hanya final teks/blok yang dapat mengedit pratinjau yang flush teks draf tertunda.

Mattermost:

- Men-stream thinking, aktivitas tool, dan teks balasan parsial ke dalam satu pos pratinjau draf yang difinalisasi di tempat saat jawaban akhir aman dikirim.
- Menggunakan fallback dengan mengirim pos akhir baru jika pos pratinjau dihapus atau tidak tersedia saat finalisasi.
- Payload akhir media/error membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal alih-alih flush pos pratinjau sementara.

Matrix:

- Pratinjau draf difinalisasi di tempat saat teks akhir dapat menggunakan kembali event pratinjau.
- Final media-saja, error, dan ketidakcocokan target balasan membatalkan pembaruan pratinjau tertunda sebelum pengiriman normal; pratinjau usang yang sudah terlihat akan di-redact.

### Pembaruan pratinjau progres tool

Streaming pratinjau juga dapat menyertakan pembaruan **progres tool** — baris status singkat seperti "searching the web", "reading file", atau "calling tool" — yang muncul dalam pesan pratinjau yang sama saat tool berjalan, sebelum balasan akhir. Ini menjaga giliran tool multi-langkah tetap terlihat hidup secara visual alih-alih diam di antara pratinjau thinking pertama dan jawaban akhir.

Surface yang didukung:

- **Discord**, **Slack**, dan **Telegram** secara default men-stream progres tool ke edit pratinjau live saat streaming pratinjau aktif.
- Telegram telah dirilis dengan pembaruan pratinjau progres tool diaktifkan sejak `v2026.4.22`; mempertahankannya tetap aktif menjaga perilaku rilis tersebut.
- **Mattermost** sudah menggabungkan aktivitas tool ke pos pratinjau draf tunggalnya (lihat di atas).
- Edit progres tool mengikuti mode streaming pratinjau aktif; edit ini dilewati saat streaming pratinjau `off` atau saat streaming blok sudah mengambil alih pesan.
- Untuk mempertahankan streaming pratinjau tetapi menyembunyikan baris progres tool, setel `streaming.preview.toolProgress` ke `false` untuk kanal tersebut. Untuk menonaktifkan edit pratinjau sepenuhnya, setel `streaming.mode` ke `off`.

Contoh:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Terkait

- [Messages](/id/concepts/messages) — siklus hidup dan pengiriman pesan
- [Retry](/id/concepts/retry) — perilaku retry saat pengiriman gagal
- [Channels](/id/channels) — dukungan streaming per kanal
