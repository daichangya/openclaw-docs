---
read_when:
    - Menjelaskan penggunaan token, biaya, atau jendela konteks
    - Men-debug pertumbuhan konteks atau perilaku pemadatan
summary: Bagaimana OpenClaw membangun konteks prompt dan melaporkan penggunaan token + biaya
title: Penggunaan Token dan Biaya
x-i18n:
    generated_at: "2026-04-07T09:19:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0683693d6c6fcde7d5fba236064ba97dd4b317ae6bea3069db969fcd178119d9
    source_path: reference/token-use.md
    workflow: 15
---

# Penggunaan token & biaya

OpenClaw melacak **token**, bukan karakter. Token bersifat spesifik model, tetapi sebagian besar
model bergaya OpenAI rata-rata ~4 karakter per token untuk teks bahasa Inggris.

## Bagaimana prompt sistem dibangun

OpenClaw menyusun prompt sistemnya sendiri pada setiap eksekusi. Isinya mencakup:

- Daftar tool + deskripsi singkat
- Daftar Skills (hanya metadata; instruksi dimuat sesuai permintaan dengan `read`)
- Instruksi pembaruan mandiri
- Workspace + file bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` saat baru, plus `MEMORY.md` saat ada atau `memory.md` sebagai fallback huruf kecil). File besar dipotong oleh `agents.defaults.bootstrapMaxChars` (default: 20000), dan total injeksi bootstrap dibatasi oleh `agents.defaults.bootstrapTotalMaxChars` (default: 150000). File `memory/*.md` bersifat sesuai permintaan melalui tool memori dan tidak disuntikkan secara otomatis.
- Waktu (UTC + zona waktu pengguna)
- Tag balasan + perilaku heartbeat
- Metadata runtime (host/OS/model/thinking)

Lihat rincian lengkapnya di [System Prompt](/id/concepts/system-prompt).

## Apa yang dihitung dalam jendela konteks

Semua yang diterima model dihitung terhadap batas konteks:

- Prompt sistem (semua bagian yang tercantum di atas)
- Riwayat percakapan (pesan pengguna + asisten)
- Pemanggilan tool dan hasil tool
- Lampiran/transkrip (gambar, audio, file)
- Ringkasan pemadatan dan artefak pruning
- Wrapper provider atau header keamanan (tidak terlihat, tetapi tetap dihitung)

Untuk gambar, OpenClaw mengecilkan payload gambar transkrip/tool sebelum panggilan provider.
Gunakan `agents.defaults.imageMaxDimensionPx` (default: `1200`) untuk menyesuaikan ini:

- Nilai yang lebih rendah biasanya mengurangi penggunaan vision-token dan ukuran payload.
- Nilai yang lebih tinggi mempertahankan lebih banyak detail visual untuk tangkapan layar yang berat OCR/UI.

Untuk rincian praktis (per file yang disuntikkan, tool, Skills, dan ukuran prompt sistem), gunakan `/context list` atau `/context detail`. Lihat [Context](/id/concepts/context).

## Cara melihat penggunaan token saat ini

Gunakan ini di chat:

- `/status` → **kartu status kaya emoji** dengan model sesi, penggunaan konteks,
  token input/output respons terakhir, dan **perkiraan biaya** (hanya API key).
- `/usage off|tokens|full` → menambahkan **footer penggunaan per respons** ke setiap balasan.
  - Disimpan per sesi (disimpan sebagai `responseUsage`).
  - Auth OAuth **menyembunyikan biaya** (hanya token).
- `/usage cost` → menampilkan ringkasan biaya lokal dari log sesi OpenClaw.

Permukaan lain:

- **TUI/Web TUI:** `/status` + `/usage` didukung.
- **CLI:** `openclaw status --usage` dan `openclaw channels list` menampilkan
  jendela kuota provider yang dinormalisasi (`X% tersisa`, bukan biaya per respons).
  Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.

Permukaan penggunaan menormalkan alias field native provider umum sebelum ditampilkan.
Untuk traffic Responses keluarga OpenAI, itu mencakup `input_tokens` /
`output_tokens` dan `prompt_tokens` / `completion_tokens`, sehingga nama field
yang spesifik transport tidak mengubah `/status`, `/usage`, atau ringkasan sesi.
Penggunaan JSON Gemini CLI juga dinormalisasi: teks balasan berasal dari `response`, dan
`stats.cached` dipetakan ke `cacheRead` dengan `stats.input_tokens - stats.cached`
digunakan saat CLI menghilangkan field `stats.input` eksplisit.
Untuk traffic Responses keluarga OpenAI native, alias penggunaan WebSocket/SSE
dinormalisasi dengan cara yang sama, dan total fallback ke input + output yang dinormalisasi saat
`total_tokens` tidak ada atau bernilai `0`.
Saat snapshot sesi saat ini minim data, `/status` dan `session_status` juga dapat
memulihkan penghitung token/cache dan label model runtime aktif dari
log penggunaan transkrip terbaru. Nilai live nonzero yang sudah ada tetap mendapat
prioritas dibanding nilai fallback transkrip, dan total transkrip yang lebih besar
dan berorientasi prompt dapat menang saat total yang tersimpan tidak ada atau lebih kecil.
Auth penggunaan untuk jendela kuota provider berasal dari hook spesifik provider saat
tersedia; jika tidak, OpenClaw fallback ke pencocokan kredensial OAuth/API key
dari profil auth, env, atau config.

## Estimasi biaya (saat ditampilkan)

Biaya diperkirakan dari config harga model Anda:

```
models.providers.<provider>.models[].cost
```

Ini adalah **USD per 1 juta token** untuk `input`, `output`, `cacheRead`, dan
`cacheWrite`. Jika harga tidak ada, OpenClaw hanya menampilkan token. Token OAuth
tidak pernah menampilkan biaya dalam dolar.

## Dampak TTL cache dan pruning

Caching prompt provider hanya berlaku dalam jendela TTL cache. OpenClaw dapat
secara opsional menjalankan **pruning cache-ttl**: ia memangkas sesi setelah TTL cache
kedaluwarsa, lalu mereset jendela cache sehingga permintaan berikutnya dapat menggunakan ulang
konteks yang baru di-cache alih-alih meng-cache ulang seluruh riwayat. Ini menjaga biaya penulisan cache
tetap lebih rendah ketika sesi menganggur melewati TTL.

Konfigurasikan ini di [Gateway configuration](/id/gateway/configuration) dan lihat
detail perilakunya di [Session pruning](/id/concepts/session-pruning).

Heartbeat dapat menjaga cache tetap **hangat** di sela jeda idle. Jika TTL cache model Anda
adalah `1h`, mengatur interval heartbeat tepat di bawah itu (misalnya `55m`) dapat menghindari
peng-cache-an ulang seluruh prompt, sehingga mengurangi biaya penulisan cache.

Dalam setup multi-agen, Anda dapat mempertahankan satu config model bersama dan menyesuaikan perilaku cache
per agen dengan `agents.list[].params.cacheRetention`.

Untuk panduan lengkap per pengaturan, lihat [Prompt Caching](/id/reference/prompt-caching).

Untuk harga API Anthropic, pembacaan cache jauh lebih murah daripada token
input, sementara penulisan cache ditagih dengan pengali yang lebih tinggi. Lihat harga
prompt caching Anthropic untuk tarif dan pengali TTL terbaru:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Contoh: jaga cache 1h tetap hangat dengan heartbeat

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

### Contoh: traffic campuran dengan strategi cache per agen

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

`agents.list[].params` digabungkan di atas `params` model yang dipilih, sehingga Anda dapat
meng-override hanya `cacheRetention` dan mewarisi default model lainnya tanpa perubahan.

### Contoh: aktifkan header beta konteks Anthropic 1M

Jendela konteks 1M Anthropic saat ini masih digating beta. OpenClaw dapat menyuntikkan
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

Ini hanya berlaku saat `context1m: true` diatur pada entri model tersebut.

Persyaratan: kredensial harus memenuhi syarat untuk penggunaan konteks panjang. Jika tidak,
Anthropic merespons dengan error rate limit sisi provider untuk permintaan tersebut.

Jika Anda mengautentikasi Anthropic dengan token OAuth/langganan (`sk-ant-oat-*`),
OpenClaw melewati header beta `context-1m-*` karena Anthropic saat ini
menolak kombinasi tersebut dengan HTTP 401.

## Tips untuk mengurangi tekanan token

- Gunakan `/compact` untuk meringkas sesi yang panjang.
- Pangkas output tool yang besar dalam workflow Anda.
- Turunkan `agents.defaults.imageMaxDimensionPx` untuk sesi yang banyak tangkapan layar.
- Jaga deskripsi Skills tetap singkat (daftar skill disuntikkan ke prompt).
- Pilih model yang lebih kecil untuk pekerjaan yang verbose dan eksploratif.

Lihat [Skills](/id/tools/skills) untuk rumus overhead daftar skill yang tepat.
