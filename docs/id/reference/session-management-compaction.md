---
read_when:
    - Anda perlu men-debug id sesi, JSONL transkrip, atau field sessions.json
    - Anda sedang mengubah perilaku kompaksi otomatis atau menambahkan housekeeping “pra-kompaksi”
    - Anda ingin mengimplementasikan memory flush atau giliran sistem senyap
summary: 'Pembahasan mendalam: penyimpanan sesi + transkrip, lifecycle, dan internal kompaksi (otomatis)'
title: Pembahasan Mendalam Manajemen Sesi
x-i18n:
    generated_at: "2026-04-07T09:19:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Manajemen Sesi & Kompaksi (Pembahasan Mendalam)

Dokumen ini menjelaskan bagaimana OpenClaw mengelola sesi secara end-to-end:

- **Routing sesi** (bagaimana pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacaknya
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Kebersihan transkrip** (perbaikan khusus penyedia sebelum run)
- **Batas konteks** (jendela konteks vs token yang dilacak)
- **Kompaksi** (kompaksi manual + otomatis) dan tempat mengaitkan pekerjaan pra-kompaksi
- **Housekeeping senyap** (misalnya penulisan memory yang tidak boleh menghasilkan output yang terlihat pengguna)

Jika Anda ingin ikhtisar tingkat tinggi terlebih dahulu, mulai dari:

- [/concepts/session](/id/concepts/session)
- [/concepts/compaction](/id/concepts/compaction)
- [/concepts/memory](/id/concepts/memory)
- [/concepts/memory-search](/id/concepts/memory-search)
- [/concepts/session-pruning](/id/concepts/session-pruning)
- [/reference/transcript-hygiene](/id/reference/transcript-hygiene)

---

## Sumber kebenaran: Gateway

OpenClaw dirancang di sekitar satu **proses Gateway** yang memiliki state sesi.

- UI (aplikasi macOS, web Control UI, TUI) sebaiknya meminta daftar sesi dan jumlah token ke Gateway.
- Dalam mode remote, file sesi berada di host remote; “memeriksa file Mac lokal Anda” tidak akan mencerminkan apa yang digunakan Gateway.

---

## Dua lapisan persistensi

OpenClaw menyimpan sesi dalam dua lapisan:

1. **Penyimpanan sesi (`sessions.json`)**
   - Peta key/value: `sessionKey -> SessionEntry`
   - Kecil, dapat diubah, aman untuk diedit (atau entri dihapus)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur pohon (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan aktual + pemanggilan alat + ringkasan kompaksi
   - Digunakan untuk membangun ulang konteks model untuk giliran berikutnya

---

## Lokasi di disk

Per agen, pada host Gateway:

- Penyimpanan: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesi topik Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw me-resolve ini melalui `src/config/sessions.ts`.

---

## Pemeliharaan penyimpanan dan kontrol disk

Persistensi sesi memiliki kontrol pemeliharaan otomatis (`session.maintenance`) untuk `sessions.json` dan artefak transkrip:

- `mode`: `warn` (default) atau `enforce`
- `pruneAfter`: cutoff usia entri basi (default `30d`)
- `maxEntries`: batas entri dalam `sessions.json` (default `500`)
- `rotateBytes`: rotasi `sessions.json` saat ukurannya terlalu besar (default `10mb`)
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama dengan `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran direktori sesi opsional
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Urutan enforcement untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak transkrip arsip atau yatim tertua terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua dan file transkripnya.
3. Lanjutkan sampai penggunaan berada pada atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi pengeluaran tetapi tidak mengubah penyimpanan/file.

Jalankan pemeliharaan sesuai kebutuhan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi cron dan log run

Run cron terisolasi juga membuat entri/transkrip sesi, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi run cron terisolasi lama dari penyimpanan sesi (`false` menonaktifkan).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas file `~/.openclaw/cron/runs/<jobId>.jsonl` (default: `2_000_000` byte dan `2000` baris).

---

## Key sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan_ tempat Anda berada (routing + isolasi).

Pola umum:

- Chat utama/langsung (per agen): `agent:<agentId>:<mainKey>` (default `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Room/saluran (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (kecuali dioverride)

Aturan kanonis didokumentasikan di [/concepts/session](/id/concepts/session).

---

## Id sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (file transkrip yang melanjutkan percakapan).

Aturan praktis:

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default pukul 4:00 pagi waktu lokal pada host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau `session.idleMinutes` lama) membuat `sessionId` baru saat pesan tiba setelah jendela idle. Saat harian + idle sama-sama dikonfigurasi, yang lebih dulu kedaluwarsa yang menang.
- **Guard fork induk thread** (`session.parentForkMaxTokens`, default `100000`) melewati forking transkrip induk ketika sesi induk sudah terlalu besar; thread baru dimulai dari awal. Set `0` untuk menonaktifkan.

Detail implementasi: keputusan ini terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema penyimpanan sesi (`sessions.json`)

Tipe nilai penyimpanan adalah `SessionEntry` dalam `src/config/sessions.ts`.

Field penting (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` diatur)
- `updatedAt`: timestamp aktivitas terakhir
- `sessionFile`: override path transkrip eksplisit opsional
- `chatType`: `direct | group | room` (membantu UI dan kebijakan pengiriman)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata untuk pelabelan grup/saluran
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sesi)
- Pemilihan model:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Penghitung token (best-effort / bergantung penyedia):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: seberapa sering kompaksi otomatis selesai untuk key sesi ini
- `memoryFlushAt`: timestamp untuk pre-compaction memory flush terakhir
- `memoryFlushCompactionCount`: jumlah kompaksi saat flush terakhir dijalankan

Penyimpanan aman untuk diedit, tetapi Gateway adalah otoritasnya: ia dapat menulis ulang atau merehidrasi entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `SessionManager` dari `@mariozechner/pi-coding-agent`.

File ini berformat JSONL:

- Baris pertama: header sesi (`type: "session"`, mencakup `id`, `cwd`, `timestamp`, `parentSession` opsional)
- Lalu: entri sesi dengan `id` + `parentId` (pohon)

Jenis entri yang penting:

- `message`: pesan user/assistant/toolResult
- `custom_message`: pesan yang disisipkan extension yang _memang_ masuk ke konteks model (dapat disembunyikan dari UI)
- `custom`: state extension yang _tidak_ masuk ke konteks model
- `compaction`: ringkasan kompaksi yang dipersistenkan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipersistenkan saat menavigasi cabang pohon

OpenClaw sengaja **tidak** melakukan “fix up” pada transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Jendela konteks vs token yang dilacak

Dua konsep berbeda yang penting:

1. **Jendela konteks model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung penyimpanan sesi**: statistik bergulir yang ditulis ke `sessions.json` (digunakan untuk /status dan dashboard)

Jika Anda sedang menyetel batas:

- Jendela konteks berasal dari katalog model (dan dapat dioverride melalui config).
- `contextTokens` di penyimpanan adalah nilai estimasi/pelaporan runtime; jangan perlakukan sebagai jaminan yang ketat.

Untuk detail lebih lanjut, lihat [/token-use](/id/reference/token-use).

---

## Kompaksi: apa itu

Kompaksi meringkas percakapan lama menjadi entri `compaction` yang dipersistenkan di transkrip dan mempertahankan pesan terbaru tetap utuh.

Setelah kompaksi, giliran berikutnya melihat:

- Ringkasan kompaksi
- Pesan setelah `firstKeptEntryId`

Kompaksi bersifat **persisten** (tidak seperti session pruning). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas chunk kompaksi dan pemasangan alat

Saat OpenClaw membagi transkrip panjang menjadi chunk kompaksi, ia menjaga
pemanggilan alat assistant tetap berpasangan dengan entri `toolResult` yang cocok.

- Jika pemisahan token-share jatuh di antara pemanggilan alat dan hasilnya, OpenClaw
  menggeser batas ke pesan pemanggilan alat assistant alih-alih memisahkan
  pasangan tersebut.
- Jika blok tool-result di bagian akhir sebaliknya akan mendorong chunk melewati target,
  OpenClaw mempertahankan blok alat tertunda itu dan menjaga tail yang belum diringkas tetap utuh.
- Blok pemanggilan alat yang dibatalkan/error tidak menahan pemisahan tertunda tetap terbuka.

---

## Kapan kompaksi otomatis terjadi (runtime Pi)

Dalam agen Pi yang tersemat, kompaksi otomatis dipicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan error overflow konteks
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa yang dibentuk penyedia) → kompaksi → coba lagi.
2. **Pemeliharaan ambang**: setelah giliran berhasil, ketika:

`contextTokens > contextWindow - reserveTokens`

Di mana:

- `contextWindow` adalah jendela konteks model
- `reserveTokens` adalah ruang cadangan untuk prompt + output model berikutnya

Ini adalah semantik runtime Pi (OpenClaw mengonsumsi event tersebut, tetapi Pi yang memutuskan kapan melakukan kompaksi).

---

## Pengaturan kompaksi (`reserveTokens`, `keepRecentTokens`)

Pengaturan kompaksi Pi berada di pengaturan Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw juga menerapkan ambang aman untuk run tersemat:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw akan menaikkannya.
- Ambang default adalah `20000` token.
- Set `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan ambang.
- Jika nilainya sudah lebih tinggi, OpenClaw membiarkannya.

Mengapa: sisakan cukup ruang cadangan untuk “housekeeping” multi-giliran (seperti penulisan memory) sebelum kompaksi menjadi tak terhindarkan.

Implementasi: `ensurePiCompactionReserveTokens()` dalam `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Permukaan yang terlihat pengguna

Anda dapat mengamati kompaksi dan state sesi melalui:

- `/status` (di sesi chat mana pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah kompaksi

---

## Housekeeping senyap (`NO_REPLY`)

OpenClaw mendukung giliran “senyap” untuk tugas latar belakang saat pengguna tidak seharusnya melihat output antara.

Konvensi:

- Assistant memulai outputnya dengan token senyap yang tepat `NO_REPLY` /
  `no_reply` untuk menandakan “jangan kirim balasan kepada pengguna”.
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap yang tepat bersifat case-insensitive, jadi `NO_REPLY` dan
  `no_reply` sama-sama dihitung ketika seluruh payload hanyalah token senyap.
- Ini hanya untuk giliran latar belakang/tanpa pengiriman yang benar-benar senyap; ini bukan jalan pintas untuk
  permintaan pengguna biasa yang dapat ditindaklanjuti.

Mulai `2026.1.10`, OpenClaw juga menekan **streaming draf/mengetik** saat
chunk parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan
output parsial di tengah giliran.

---

## "Memory flush" pra-kompaksi (sudah diimplementasikan)

Tujuan: sebelum kompaksi otomatis terjadi, jalankan giliran agentic senyap yang menulis
state tahan lama ke disk (misalnya `memory/YYYY-MM-DD.md` di workspace agen) agar kompaksi tidak dapat
menghapus konteks penting.

OpenClaw menggunakan pendekatan **flush sebelum ambang**:

1. Pantau penggunaan konteks sesi.
2. Saat melampaui “ambang lunak” (di bawah ambang kompaksi Pi), jalankan direktif senyap
   “tulis memory sekarang” ke agen.
3. Gunakan token senyap yang tepat `NO_REPLY` / `no_reply` agar pengguna tidak melihat
   apa pun.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (pesan user untuk giliran flush)
- `systemPrompt` (prompt sistem tambahan yang ditambahkan untuk giliran flush)

Catatan:

- Prompt/system prompt default menyertakan petunjuk `NO_REPLY` untuk menekan
  pengiriman.
- Flush dijalankan sekali per siklus kompaksi (dilacak di `sessions.json`).
- Flush hanya berjalan untuk sesi Pi tersemat (backend CLI melewatinya).
- Flush dilewati saat workspace sesi bersifat read-only (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memory](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

Pi juga mengekspos hook `session_before_compact` di API extension, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Daftar periksa pemecahan masalah

- Key sesi salah? Mulai dari [/concepts/session](/id/concepts/session) dan konfirmasi `sessionKey` di `/status`.
- Penyimpanan vs transkrip tidak cocok? Konfirmasi host Gateway dan path penyimpanan dari `openclaw status`.
- Spam kompaksi? Periksa:
  - jendela konteks model (terlalu kecil)
  - pengaturan kompaksi (`reserveTokens` yang terlalu tinggi untuk jendela model dapat menyebabkan kompaksi lebih awal)
  - pembengkakan tool-result: aktifkan/setel session pruning
- Giliran senyap bocor? Pastikan balasan dimulai dengan `NO_REPLY` (token tepat case-insensitive) dan Anda menggunakan build yang mencakup perbaikan penekanan streaming.
