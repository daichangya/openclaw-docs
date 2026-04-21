---
read_when:
    - Menjelaskan penggunaan token, biaya, atau jendela konteks
    - Men-debug pertumbuhan konteks atau perilaku Compaction
summary: Bagaimana OpenClaw membangun konteks prompt dan melaporkan penggunaan token + biaya
title: Penggunaan Token dan Biaya
x-i18n:
    generated_at: "2026-04-21T09:24:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# Penggunaan Token & Biaya

OpenClaw melacak **token**, bukan karakter. Token bersifat spesifik model, tetapi sebagian besar
model bergaya OpenAI rata-rata ~4 karakter per token untuk teks bahasa Inggris.

## Cara system prompt dibangun

OpenClaw menyusun system prompt-nya sendiri pada setiap proses. Isinya mencakup:

- Daftar tool + deskripsi singkat
- Daftar Skills (hanya metadata; instruksi dimuat sesuai permintaan dengan `read`).
  Blok Skills ringkas dibatasi oleh `skills.limits.maxSkillsPromptChars`,
  dengan override opsional per agen di
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruksi pembaruan mandiri
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` saat baru, serta `MEMORY.md` saat ada atau `memory.md` sebagai fallback huruf kecil). File besar dipotong oleh `agents.defaults.bootstrapMaxChars` (default: 12000), dan total injeksi bootstrap dibatasi oleh `agents.defaults.bootstrapTotalMaxChars` (default: 60000). File harian `memory/*.md` bukan bagian dari prompt bootstrap normal; file tersebut tetap sesuai permintaan melalui tool memori pada giliran biasa, tetapi `/new` dan `/reset` tanpa tambahan dapat menambahkan blok konteks startup sekali pakai dengan memori harian terbaru untuk giliran pertama itu. Pendahuluan startup ini dikontrol oleh `agents.defaults.startupContext`.
- Waktu (UTC + zona waktu pengguna)
- Tag balasan + perilaku Heartbeat
- Metadata runtime (host/OS/model/thinking)

Lihat rincian lengkapnya di [System Prompt](/id/concepts/system-prompt).

## Apa yang dihitung dalam jendela konteks

Semua yang diterima model dihitung terhadap batas konteks:

- System prompt (semua bagian yang tercantum di atas)
- Riwayat percakapan (pesan pengguna + asisten)
- Pemanggilan tool dan hasil tool
- Lampiran/transkrip (gambar, audio, file)
- Ringkasan Compaction dan artefak pemangkasan
- Wrapper provider atau header keamanan (tidak terlihat, tetapi tetap dihitung)

Beberapa permukaan runtime yang berat memiliki batas eksplisit sendiri:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Override per agen berada di bawah `agents.list[].contextLimits`. Knop-knop ini
ditujukan untuk kutipan runtime yang dibatasi dan blok milik runtime yang disuntikkan. Knop ini
terpisah dari batas bootstrap, batas konteks startup, dan batas prompt Skills.

Untuk gambar, OpenClaw melakukan downscale payload gambar transkrip/tool sebelum pemanggilan provider.
Gunakan `agents.defaults.imageMaxDimensionPx` (default: `1200`) untuk menyesuaikan ini:

- Nilai yang lebih rendah biasanya mengurangi penggunaan vision-token dan ukuran payload.
- Nilai yang lebih tinggi mempertahankan lebih banyak detail visual untuk tangkapan layar berat OCR/UI.

Untuk rincian praktis (per file yang disuntikkan, tool, Skills, dan ukuran system prompt), gunakan `/context list` atau `/context detail`. Lihat [Context](/id/concepts/context).

## Cara melihat penggunaan token saat ini

Gunakan ini di chat:

- `/status` → **kartu status kaya emoji** dengan model sesi, penggunaan konteks,
  token input/output respons terakhir, dan **estimasi biaya** (khusus API key).
- `/usage off|tokens|full` → menambahkan **footer penggunaan per respons** ke setiap balasan.
  - Persisten per sesi (disimpan sebagai `responseUsage`).
  - Auth OAuth **menyembunyikan biaya** (hanya token).
- `/usage cost` → menampilkan ringkasan biaya lokal dari log sesi OpenClaw.

Permukaan lain:

- **TUI/Web TUI:** `/status` + `/usage` didukung.
- **CLI:** `openclaw status --usage` dan `openclaw channels list` menampilkan
  jendela kuota provider yang dinormalisasi (`X% tersisa`, bukan biaya per respons).
  Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.

Permukaan penggunaan menormalkan alias field native provider umum sebelum ditampilkan.
Untuk lalu lintas Responses keluarga OpenAI, itu mencakup `input_tokens` /
`output_tokens` maupun `prompt_tokens` / `completion_tokens`, sehingga nama field
khusus transport tidak mengubah `/status`, `/usage`, atau ringkasan sesi.
Penggunaan JSON Gemini CLI juga dinormalisasi: teks balasan berasal dari `response`, dan
`stats.cached` dipetakan ke `cacheRead` dengan `stats.input_tokens - stats.cached`
digunakan ketika CLI menghilangkan field `stats.input` yang eksplisit.
Untuk lalu lintas Responses keluarga OpenAI native, alias penggunaan WebSocket/SSE
dinormalisasi dengan cara yang sama, dan total akan fallback ke input + output yang dinormalisasi ketika
`total_tokens` hilang atau `0`.
Ketika snapshot sesi saat ini jarang, `/status` dan `session_status` juga dapat
memulihkan penghitung token/cache dan label model runtime aktif dari log penggunaan transkrip terbaru. Nilai live yang bukan nol tetap didahulukan atas nilai fallback transkrip, dan total transkrip berorientasi prompt yang lebih besar
dapat menang ketika total tersimpan hilang atau lebih kecil.
Auth penggunaan untuk jendela kuota provider berasal dari hook khusus provider bila
tersedia; jika tidak, OpenClaw kembali mencocokkan kredensial OAuth/API key
dari auth profile, env, atau konfigurasi.
Entri transkrip asisten mempertahankan bentuk penggunaan ternormalisasi yang sama, termasuk
`usage.cost` ketika model aktif telah dikonfigurasi harga dan provider
mengembalikan metadata penggunaan. Ini memberi `/usage cost` dan status sesi berbasis transkrip
sumber yang stabil bahkan setelah status runtime live hilang.

## Estimasi biaya (saat ditampilkan)

Biaya diestimasi dari konfigurasi harga model Anda:

```
models.providers.<provider>.models[].cost
```

Nilai-nilai ini adalah **USD per 1 juta token** untuk `input`, `output`, `cacheRead`, dan
`cacheWrite`. Jika harga tidak ada, OpenClaw hanya menampilkan token. Token OAuth
tidak pernah menampilkan biaya dolar.

## Dampak TTL cache dan pemangkasan

Cache prompt provider hanya berlaku dalam jendela TTL cache. OpenClaw dapat
secara opsional menjalankan **pemangkasan cache-ttl**: memangkas sesi begitu TTL cache
kedaluwarsa, lalu mereset jendela cache sehingga permintaan berikutnya dapat
menggunakan ulang konteks yang baru di-cache alih-alih me-cache ulang seluruh riwayat. Ini menjaga biaya penulisan cache tetap lebih rendah ketika sesi diam melewati TTL.

Konfigurasikan di [Gateway configuration](/id/gateway/configuration) dan lihat
detail perilakunya di [Session pruning](/id/concepts/session-pruning).

Heartbeat dapat menjaga cache tetap **hangat** di sela waktu idle. Jika TTL cache model Anda
adalah `1h`, menyetel interval Heartbeat sedikit di bawah itu (misalnya `55m`) dapat menghindari
cache ulang prompt penuh, sehingga mengurangi biaya penulisan cache.

Dalam konfigurasi multi-agen, Anda dapat menyimpan satu konfigurasi model bersama dan menyesuaikan perilaku cache
per agen dengan `agents.list[].params.cacheRetention`.

Untuk panduan lengkap per knop, lihat [Prompt Caching](/id/reference/prompt-caching).

Untuk harga API Anthropic, pembacaan cache jauh lebih murah daripada token input,
sementara penulisan cache ditagih dengan pengali yang lebih tinggi. Lihat harga prompt caching Anthropic untuk tarif terbaru dan pengali TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Contoh: jaga cache 1 jam tetap hangat dengan Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Contoh: lalu lintas campuran dengan strategi cache per agen

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # baseline default untuk sebagian besar agen
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # jaga cache panjang tetap hangat untuk sesi mendalam
    - id: "alerts"
      params:
        cacheRetention: "none" # hindari penulisan cache untuk notifikasi yang bursty
```

`agents.list[].params` digabungkan di atas `params` milik model yang dipilih, sehingga Anda dapat
meng-override hanya `cacheRetention` dan tetap mewarisi default model lainnya.

### Contoh: aktifkan header beta konteks 1 juta Anthropic

Jendela konteks 1 juta Anthropic saat ini diproteksi beta. OpenClaw dapat menyuntikkan
nilai `anthropic-beta` yang diperlukan saat Anda mengaktifkan `context1m` pada model Opus
atau Sonnet yang didukung.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Ini dipetakan ke header beta `context-1m-2025-08-07` milik Anthropic.

Ini hanya berlaku ketika `context1m: true` diatur pada entri model tersebut.

Persyaratan: kredensial harus memenuhi syarat untuk penggunaan konteks panjang. Jika tidak,
Anthropic merespons dengan error rate limit dari sisi provider untuk permintaan tersebut.

Jika Anda mengautentikasi Anthropic dengan token OAuth/langganan (`sk-ant-oat-*`),
OpenClaw melewati header beta `context-1m-*` karena Anthropic saat ini
menolak kombinasi itu dengan HTTP 401.

## Tips mengurangi tekanan token

- Gunakan `/compact` untuk meringkas sesi yang panjang.
- Pangkas keluaran tool yang besar dalam alur kerja Anda.
- Turunkan `agents.defaults.imageMaxDimensionPx` untuk sesi yang banyak berisi tangkapan layar.
- Jaga deskripsi skill tetap singkat (daftar skill disuntikkan ke prompt).
- Utamakan model yang lebih kecil untuk pekerjaan eksploratif yang verbose.

Lihat [Skills](/id/tools/skills) untuk rumus overhead daftar skill yang tepat.
