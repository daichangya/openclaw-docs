---
read_when:
    - Anda perlu men-debug id sesi, JSONL transkrip, atau field `sessions.json`
    - Anda sedang mengubah perilaku Compaction otomatis atau menambahkan housekeeping “pra-Compaction”
    - Anda ingin mengimplementasikan flush memori atau turn sistem senyap
summary: 'Pendalaman: penyimpanan sesi + transkrip, siklus hidup, dan internal Compaction (otomatis)'
title: Pendalaman manajemen sesi
x-i18n:
    generated_at: "2026-04-25T13:56:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15b8cf4b1deb947b292c6931257218d7147c11c963e7bf2689b6d1f77ea8159
    source_path: reference/session-management-compaction.md
    workflow: 15
---

Halaman ini menjelaskan cara OpenClaw mengelola sesi secara end-to-end:

- **Perutean sesi** (bagaimana pesan masuk dipetakan ke `sessionKey`)
- **Penyimpanan sesi** (`sessions.json`) dan apa yang dilacak
- **Persistensi transkrip** (`*.jsonl`) dan strukturnya
- **Kebersihan transkrip** (fixup khusus provider sebelum run)
- **Batas context** (context window vs token yang dilacak)
- **Compaction** (Compaction manual + otomatis) dan tempat mengaitkan pekerjaan pra-Compaction
- **Housekeeping senyap** (misalnya penulisan memori yang tidak boleh menghasilkan output yang terlihat oleh pengguna)

Jika Anda menginginkan gambaran tingkat tinggi terlebih dahulu, mulai dari:

- [Manajemen sesi](/id/concepts/session)
- [Compaction](/id/concepts/compaction)
- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Kebersihan transkrip](/id/reference/transcript-hygiene)

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
   - Kecil, dapat diubah, aman untuk diedit (atau menghapus entri)
   - Melacak metadata sesi (id sesi saat ini, aktivitas terakhir, toggle, penghitung token, dll.)

2. **Transkrip (`<sessionId>.jsonl`)**
   - Transkrip append-only dengan struktur tree (entri memiliki `id` + `parentId`)
   - Menyimpan percakapan sebenarnya + pemanggilan tool + ringkasan Compaction
   - Digunakan untuk membangun ulang context model untuk turn berikutnya

---

## Lokasi di disk

Per agen, di host Gateway:

- Penyimpanan: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesi topik Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw menyelesaikan ini melalui `src/config/sessions.ts`.

---

## Pemeliharaan penyimpanan dan kontrol disk

Persistensi sesi memiliki kontrol pemeliharaan otomatis (`session.maintenance`) untuk `sessions.json` dan artefak transkrip:

- `mode`: `warn` (default) atau `enforce`
- `pruneAfter`: batas usia entri usang (default `30d`)
- `maxEntries`: batas jumlah entri di `sessions.json` (default `500`)
- `rotateBytes`: rotasi `sessions.json` saat terlalu besar (default `10mb`)
- `resetArchiveRetention`: retensi untuk arsip transkrip `*.reset.<timestamp>` (default: sama dengan `pruneAfter`; `false` menonaktifkan pembersihan)
- `maxDiskBytes`: anggaran opsional direktori sesi
- `highWaterBytes`: target opsional setelah pembersihan (default `80%` dari `maxDiskBytes`)

Urutan enforcement untuk pembersihan anggaran disk (`mode: "enforce"`):

1. Hapus artefak transkrip arsip atau yatim piatu yang paling lama terlebih dahulu.
2. Jika masih di atas target, keluarkan entri sesi tertua dan file transkripnya.
3. Lanjutkan sampai penggunaan berada di atau di bawah `highWaterBytes`.

Dalam `mode: "warn"`, OpenClaw melaporkan potensi eviction tetapi tidak mengubah penyimpanan/file.

Jalankan pemeliharaan sesuai kebutuhan:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesi Cron dan log run

Run Cron yang terisolasi juga membuat entri/transkrip sesi, dan memiliki kontrol retensi khusus:

- `cron.sessionRetention` (default `24h`) memangkas sesi run Cron terisolasi lama dari penyimpanan sesi (`false` menonaktifkan).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` memangkas file `~/.openclaw/cron/runs/<jobId>.jsonl` (default: `2_000_000` byte dan `2000` baris).

Saat Cron memaksa pembuatan sesi run terisolasi baru, ia men-sanitasi entri sesi `cron:<jobId>` sebelumnya sebelum menulis baris baru. Ia membawa preferensi aman seperti pengaturan thinking/fast/verbose, label, dan override model/auth yang dipilih pengguna secara eksplisit. Ia membuang context percakapan ambient seperti perutean channel/group, kebijakan kirim atau antrean, elevasi, origin, dan binding runtime ACP sehingga run terisolasi baru tidak dapat mewarisi otoritas pengiriman atau runtime yang usang dari run lama.

---

## Kunci sesi (`sessionKey`)

`sessionKey` mengidentifikasi _bucket percakapan mana_ tempat Anda berada (perutean + isolasi).

Pola umum:

- Chat utama/langsung (per agen): `agent:<agentId>:<mainKey>` (default `main`)
- Grup: `agent:<agentId>:<channel>:group:<id>`
- Room/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` atau `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (kecuali dioverride)

Aturan kanonis didokumentasikan di [/concepts/session](/id/concepts/session).

---

## Id sesi (`sessionId`)

Setiap `sessionKey` menunjuk ke `sessionId` saat ini (file transkrip yang melanjutkan percakapan).

Aturan praktis:

- **Reset** (`/new`, `/reset`) membuat `sessionId` baru untuk `sessionKey` tersebut.
- **Reset harian** (default pukul 4:00 pagi waktu lokal di host gateway) membuat `sessionId` baru pada pesan berikutnya setelah batas reset.
- **Kedaluwarsa idle** (`session.reset.idleMinutes` atau lama `session.idleMinutes`) membuat `sessionId` baru saat pesan tiba setelah jendela idle. Saat harian + idle keduanya dikonfigurasi, mana yang kedaluwarsa lebih dulu akan menang.
- **Thread parent fork guard** (`session.parentForkMaxTokens`, default `100000`) melewati forking transkrip parent saat sesi parent sudah terlalu besar; thread baru dimulai dari awal. Setel `0` untuk menonaktifkan.

Detail implementasi: keputusan ini terjadi di `initSessionState()` dalam `src/auto-reply/reply/session.ts`.

---

## Skema penyimpanan sesi (`sessions.json`)

Tipe nilai penyimpanan adalah `SessionEntry` dalam `src/config/sessions.ts`.

Field utama (tidak lengkap):

- `sessionId`: id transkrip saat ini (nama file diturunkan dari ini kecuali `sessionFile` disetel)
- `updatedAt`: stempel waktu aktivitas terakhir
- `sessionFile`: override jalur transkrip eksplisit opsional
- `chatType`: `direct | group | room` (membantu UI dan kebijakan kirim)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata untuk pelabelan grup/channel
- Toggle:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sesi)
- Pemilihan model:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Penghitung token (best-effort / bergantung provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: seberapa sering Compaction otomatis selesai untuk key sesi ini
- `memoryFlushAt`: stempel waktu untuk flush memori pra-Compaction terakhir
- `memoryFlushCompactionCount`: jumlah Compaction saat flush terakhir dijalankan

Penyimpanan aman untuk diedit, tetapi Gateway adalah otoritasnya: ia dapat menulis ulang atau merehidrasi entri saat sesi berjalan.

---

## Struktur transkrip (`*.jsonl`)

Transkrip dikelola oleh `SessionManager` dari `@mariozechner/pi-coding-agent`.

File berbentuk JSONL:

- Baris pertama: header sesi (`type: "session"`, mencakup `id`, `cwd`, `timestamp`, opsional `parentSession`)
- Lalu: entri sesi dengan `id` + `parentId` (tree)

Jenis entri penting:

- `message`: pesan user/asisten/toolResult
- `custom_message`: pesan yang disuntikkan extension yang _masuk_ ke context model (dapat disembunyikan dari UI)
- `custom`: state extension yang _tidak_ masuk ke context model
- `compaction`: ringkasan Compaction yang dipersistenkan dengan `firstKeptEntryId` dan `tokensBefore`
- `branch_summary`: ringkasan yang dipersistenkan saat menavigasi cabang tree

OpenClaw dengan sengaja **tidak** melakukan “fix up” pada transkrip; Gateway menggunakan `SessionManager` untuk membaca/menulisnya.

---

## Context window vs token yang dilacak

Dua konsep yang berbeda penting:

1. **Context window model**: batas keras per model (token yang terlihat oleh model)
2. **Penghitung penyimpanan sesi**: statistik bergulir yang ditulis ke `sessions.json` (digunakan untuk /status dan dasbor)

Jika Anda menyetel batas:

- Context window berasal dari katalog model (dan dapat dioverride melalui config).
- `contextTokens` dalam penyimpanan adalah nilai estimasi/pelaporan runtime; jangan perlakukan sebagai jaminan ketat.

Untuk informasi lebih lanjut, lihat [/token-use](/id/reference/token-use).

---

## Compaction: apa itu

Compaction merangkum percakapan lama menjadi entri `compaction` yang dipersistenkan dalam transkrip dan mempertahankan pesan terbaru tetap utuh.

Setelah Compaction, turn berikutnya akan melihat:

- Ringkasan Compaction
- Pesan setelah `firstKeptEntryId`

Compaction bersifat **persisten** (tidak seperti pemangkasan sesi). Lihat [/concepts/session-pruning](/id/concepts/session-pruning).

## Batas chunk Compaction dan pemasangan tool

Saat OpenClaw membagi transkrip panjang menjadi chunk Compaction, ia menjaga pemanggilan tool asisten tetap berpasangan dengan entri `toolResult` yang cocok.

- Jika pembagian porsi token jatuh di antara pemanggilan tool dan hasilnya, OpenClaw menggeser batas ke pesan pemanggilan tool asisten alih-alih memisahkan pasangannya.
- Jika blok tool-result di bagian akhir sebaliknya akan mendorong chunk melewati target, OpenClaw mempertahankan blok tool tertunda tersebut dan menjaga ekor yang tidak diringkas tetap utuh.
- Blok pemanggilan tool yang dibatalkan/error tidak menahan split tertunda tetap terbuka.

---

## Kapan Compaction otomatis terjadi (runtime Pi)

Dalam agen Pi tertanam, Compaction otomatis dipicu dalam dua kasus:

1. **Pemulihan overflow**: model mengembalikan error context overflow
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, dan varian serupa berbentuk provider lainnya) → compact → retry.
2. **Pemeliharaan ambang batas**: setelah turn berhasil, ketika:

`contextTokens > contextWindow - reserveTokens`

Dengan:

- `contextWindow` adalah context window model
- `reserveTokens` adalah headroom yang dicadangkan untuk prompt + output model berikutnya

Ini adalah semantik runtime Pi (OpenClaw mengonsumsi event, tetapi Pi yang memutuskan kapan harus melakukan Compaction).

---

## Pengaturan Compaction (`reserveTokens`, `keepRecentTokens`)

Pengaturan Compaction Pi berada di pengaturan Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw juga menegakkan safety floor untuk run tertanam:

- Jika `compaction.reserveTokens < reserveTokensFloor`, OpenClaw menaikkannya.
- Floor default adalah `20000` token.
- Setel `agents.defaults.compaction.reserveTokensFloor: 0` untuk menonaktifkan floor.
- Jika sudah lebih tinggi, OpenClaw membiarkannya.
- `/compact` manual menghormati `agents.defaults.compaction.keepRecentTokens` yang eksplisit
  dan mempertahankan titik potong ekor terbaru Pi. Tanpa anggaran keep yang eksplisit,
  Compaction manual tetap menjadi checkpoint keras dan context yang dibangun ulang dimulai dari
  ringkasan baru.

Mengapa: sisakan headroom yang cukup untuk “housekeeping” multi-turn (seperti penulisan memori) sebelum Compaction menjadi tidak terelakkan.

Implementasi: `ensurePiCompactionReserveTokens()` dalam `src/agents/pi-settings.ts`
(dipanggil dari `src/agents/pi-embedded-runner.ts`).

---

## Provider Compaction yang dapat dipasang

Plugin dapat mendaftarkan provider Compaction melalui `registerCompactionProvider()` pada API plugin. Saat `agents.defaults.compaction.provider` disetel ke id provider yang terdaftar, extension safeguard mendelegasikan peringkasan ke provider tersebut alih-alih pipeline bawaan `summarizeInStages`.

- `provider`: id dari plugin provider Compaction yang terdaftar. Biarkan tidak disetel untuk peringkasan LLM default.
- Menyetel `provider` memaksa `mode: "safeguard"`.
- Provider menerima instruksi Compaction dan kebijakan preservasi identifier yang sama seperti jalur bawaan.
- Safeguard tetap mempertahankan context sufiks turn-terbaru dan split-turn setelah output provider.
- Peringkasan safeguard bawaan men-distill ulang ringkasan sebelumnya dengan pesan baru
  alih-alih mempertahankan seluruh ringkasan sebelumnya secara verbatim.
- Mode safeguard mengaktifkan audit kualitas ringkasan secara default; setel
  `qualityGuard.enabled: false` untuk melewati perilaku retry-on-malformed-output.
- Jika provider gagal atau mengembalikan hasil kosong, OpenClaw secara otomatis kembali ke peringkasan LLM bawaan.
- Sinyal abort/timeout dilempar ulang (tidak ditelan) untuk menghormati pembatalan oleh pemanggil.

Sumber: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Permukaan yang terlihat oleh pengguna

Anda dapat mengamati Compaction dan state sesi melalui:

- `/status` (di sesi chat mana pun)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbose: `🧹 Auto-compaction complete` + jumlah Compaction

---

## Housekeeping senyap (`NO_REPLY`)

OpenClaw mendukung turn “senyap” untuk tugas latar belakang saat pengguna tidak boleh melihat output perantara.

Konvensi:

- Asisten memulai output-nya dengan token senyap persis `NO_REPLY` /
  `no_reply` untuk menunjukkan “jangan kirim balasan kepada pengguna”.
- OpenClaw menghapus/menekan ini di lapisan pengiriman.
- Penekanan token senyap persis tidak peka huruf besar-kecil, sehingga `NO_REPLY` dan
  `no_reply` keduanya berlaku saat seluruh payload hanyalah token senyap tersebut.
- Ini hanya untuk turn latar belakang/tanpa pengiriman yang benar-benar senyap; ini bukan jalan pintas untuk
  permintaan pengguna biasa yang dapat ditindaklanjuti.

Mulai `2026.1.10`, OpenClaw juga menekan **draft/typing streaming** ketika
chunk parsial dimulai dengan `NO_REPLY`, sehingga operasi senyap tidak membocorkan output
parsial di tengah turn.

---

## "Memory flush" pra-Compaction (sudah diimplementasikan)

Tujuan: sebelum Compaction otomatis terjadi, jalankan turn agentic senyap yang menulis state
yang tahan lama ke disk (misalnya `memory/YYYY-MM-DD.md` di workspace agen) sehingga Compaction tidak bisa
menghapus context penting.

OpenClaw menggunakan pendekatan **flush pra-ambang**:

1. Pantau penggunaan context sesi.
2. Saat melewati “ambang lunak” (di bawah ambang Compaction Pi), jalankan arahan senyap
   “tulis memori sekarang” ke agen.
3. Gunakan token senyap persis `NO_REPLY` / `no_reply` sehingga pengguna tidak melihat
   apa pun.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (pesan user untuk turn flush)
- `systemPrompt` (system prompt tambahan yang ditambahkan untuk turn flush)

Catatan:

- Prompt/system prompt default menyertakan petunjuk `NO_REPLY` untuk menekan
  pengiriman.
- Flush berjalan sekali per siklus Compaction (dilacak di `sessions.json`).
- Flush hanya berjalan untuk sesi Pi tertanam (backend CLI melewatinya).
- Flush dilewati saat workspace sesi bersifat read-only (`workspaceAccess: "ro"` atau `"none"`).
- Lihat [Memory](/id/concepts/memory) untuk tata letak file workspace dan pola penulisan.

Pi juga mengekspos hook `session_before_compact` di API extension, tetapi logika
flush OpenClaw saat ini berada di sisi Gateway.

---

## Daftar periksa pemecahan masalah

- Kunci sesi salah? Mulai dari [/concepts/session](/id/concepts/session) dan konfirmasikan `sessionKey` di `/status`.
- Penyimpanan vs transkrip tidak cocok? Konfirmasikan host Gateway dan jalur penyimpanan dari `openclaw status`.
- Compaction terlalu sering? Periksa:
  - context window model (terlalu kecil)
  - pengaturan Compaction (`reserveTokens` yang terlalu tinggi untuk window model dapat menyebabkan Compaction lebih awal)
  - pembengkakan tool-result: aktifkan/setel pemangkasan sesi
- Turn senyap bocor? Pastikan balasan dimulai dengan `NO_REPLY` (token persis, tidak peka huruf besar-kecil) dan Anda menggunakan build yang menyertakan perbaikan penekanan streaming.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Context engine](/id/concepts/context-engine)
