---
read_when:
    - Mendiagnosis rotasi profil auth, cooldown, atau perilaku fallback model
    - Memperbarui aturan failover untuk profil auth atau model
    - Memahami cara override model sesi berinteraksi dengan retry fallback
summary: Cara OpenClaw merotasi profil auth dan melakukan fallback antar model
title: Failover Model
x-i18n:
    generated_at: "2026-04-23T09:20:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1f06d5371379cc59998e1cd6f52d250e8c4eba4e7dbfef776a090899b8d3c4
    source_path: concepts/model-failover.md
    workflow: 15
---

# Failover model

OpenClaw menangani kegagalan dalam dua tahap:

1. **Rotasi profil auth** di dalam provider saat ini.
2. **Fallback model** ke model berikutnya di `agents.defaults.model.fallbacks`.

Dokumen ini menjelaskan aturan runtime dan data yang mendasarinya.

## Alur runtime

Untuk run teks normal, OpenClaw mengevaluasi kandidat dalam urutan ini:

1. Model sesi yang saat ini dipilih.
2. `agents.defaults.model.fallbacks` yang dikonfigurasi sesuai urutan.
3. Model primary yang dikonfigurasi di akhir saat run dimulai dari override.

Di dalam setiap kandidat, OpenClaw mencoba failover profil auth sebelum maju ke
kandidat model berikutnya.

Urutan tingkat tinggi:

1. Resolve model sesi aktif dan preferensi profil auth.
2. Bangun rantai kandidat model.
3. Coba provider saat ini dengan aturan rotasi/cooldown profil auth.
4. Jika provider tersebut habis dengan error yang layak failover, pindah ke
   kandidat model berikutnya.
5. Persist override fallback yang dipilih sebelum retry dimulai agar pembaca sesi lain melihat provider/model yang sama yang akan digunakan runner.
6. Jika kandidat fallback gagal, rollback hanya field override sesi milik fallback
   saat field tersebut masih cocok dengan kandidat gagal itu.
7. Jika semua kandidat gagal, lempar `FallbackSummaryError` dengan detail
   per-attempt dan waktu kedaluwarsa cooldown tercepat saat diketahui.

Ini sengaja lebih sempit daripada "simpan dan pulihkan seluruh sesi". Runner
balasan hanya mem-persist field pemilihan model yang dimilikinya untuk fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Itu mencegah retry fallback yang gagal menimpa mutasi sesi lain yang lebih baru
yang tidak terkait seperti perubahan `/model` manual atau pembaruan rotasi sesi
yang terjadi saat attempt sedang berjalan.

## Penyimpanan auth (key + OAuth)

OpenClaw menggunakan **profil auth** untuk API key maupun token OAuth.

- Secret disimpan di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- State perutean auth runtime disimpan di `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfigurasi `auth.profiles` / `auth.order` hanya berupa **metadata + perutean** (tanpa secret).
- File OAuth legacy hanya-untuk-impor: `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat penggunaan pertama).

Detail lebih lanjut: [/concepts/oauth](/id/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa provider)

## ID profil

Login OAuth membuat profil yang berbeda sehingga beberapa akun dapat hidup berdampingan.

- Default: `provider:default` saat tidak ada email yang tersedia.
- OAuth dengan email: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil disimpan di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` di bawah `profiles`.

## Urutan rotasi

Saat sebuah provider memiliki beberapa profil, OpenClaw memilih urutan seperti ini:

1. **Konfigurasi eksplisit**: `auth.order[provider]` (jika disetel).
2. **Profil yang dikonfigurasi**: `auth.profiles` yang difilter berdasarkan provider.
3. **Profil yang tersimpan**: entri di `auth-profiles.json` untuk provider tersebut.

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan round‑robin:

- **Key primary:** jenis profil (**OAuth sebelum API key**).
- **Key sekunder:** `usageStats.lastUsed` (yang paling lama dulu, dalam masing-masing jenis).
- **Profil cooldown/nonaktif** dipindahkan ke akhir, diurutkan berdasarkan waktu kedaluwarsa terdekat.

### Sticky session (ramah cache)

OpenClaw **menyematkan profil auth yang dipilih per sesi** untuk menjaga cache provider tetap hangat.
OpenClaw **tidak** merotasi pada setiap permintaan. Profil yang disematkan digunakan ulang sampai:

- sesi di-reset (`/new` / `/reset`)
- Compaction selesai (jumlah Compaction bertambah)
- profil berada dalam cooldown/nonaktif

Pemilihan manual melalui `/model …@<profileId>` menetapkan **override pengguna** untuk sesi tersebut
dan tidak dirotasi otomatis sampai sesi baru dimulai.

Profil yang disematkan otomatis (dipilih oleh router sesi) diperlakukan sebagai **preferensi**:
profil tersebut dicoba lebih dahulu, tetapi OpenClaw dapat merotasi ke profil lain pada rate limit/timeout.
Profil yang disematkan pengguna tetap terkunci ke profil tersebut; jika gagal dan fallback model
dikonfigurasi, OpenClaw berpindah ke model berikutnya alih-alih berganti profil.

### Mengapa OAuth bisa "terlihat hilang"

Jika Anda memiliki profil OAuth dan profil API key untuk provider yang sama, round‑robin dapat beralih di antaranya di beberapa pesan kecuali disematkan. Untuk memaksa satu profil:

- Sematkan dengan `auth.order[provider] = ["provider:profileId"]`, atau
- Gunakan override per sesi melalui `/model …` dengan override profil (saat didukung oleh UI/permukaan obrolan Anda).

## Cooldown

Saat profil gagal karena error auth/rate-limit (atau timeout yang tampak
seperti rate limiting), OpenClaw menandainya dalam cooldown dan berpindah ke profil berikutnya.
Bucket rate-limit itu lebih luas daripada `429` biasa: bucket ini juga mencakup pesan provider
seperti `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted`, dan batas jendela penggunaan berkala seperti
`weekly/monthly limit reached`.
Error format/permintaan tidak valid (misalnya kegagalan validasi ID pemanggilan tool Cloud Code Assist)
diperlakukan sebagai layak failover dan menggunakan cooldown yang sama.
Error stop-reason yang kompatibel dengan OpenAI seperti `Unhandled stop reason: error`,
`stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal
timeout/failover.
Teks server generik dengan cakupan provider juga dapat masuk ke bucket timeout itu saat
sumbernya cocok dengan pola transient yang dikenal. Misalnya, Anthropic bare
`An unknown error occurred` dan payload JSON `api_error` dengan teks server transient
seperti `internal server error`, `unknown error, 520`, `upstream error`,
atau `backend error` diperlakukan sebagai timeout yang layak failover. Teks upstream
generik khusus OpenRouter seperti bare `Provider returned error` juga diperlakukan sebagai
timeout hanya saat konteks providernya memang OpenRouter. Teks fallback internal generik
seperti `LLM request failed with an unknown error.` tetap
konservatif dan tidak memicu failover dengan sendirinya.

Beberapa SDK provider mungkin akan sleep untuk jendela `Retry-After` yang lama sebelum
mengembalikan kontrol ke OpenClaw. Untuk SDK berbasis Stainless seperti Anthropic dan
OpenAI, OpenClaw membatasi waktu tunggu internal SDK `retry-after-ms` / `retry-after` hingga 60
detik secara default dan langsung menampilkan respons retryable yang lebih panjang agar jalur
failover ini dapat berjalan. Atur atau nonaktifkan batas ini dengan
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; lihat [/concepts/retry](/id/concepts/retry).

Cooldown rate-limit juga dapat memiliki cakupan model:

- OpenClaw mencatat `cooldownModel` untuk kegagalan rate-limit saat id model yang gagal diketahui.
- Model sibling pada provider yang sama tetap dapat dicoba saat cooldown memiliki cakupan ke model yang berbeda.
- Jendela billing/nonaktif tetap memblokir seluruh profil di semua model.

Cooldown menggunakan exponential backoff:

- 1 menit
- 5 menit
- 25 menit
- 1 jam (batas)

State disimpan di `auth-state.json` di bawah `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Penonaktifan billing

Kegagalan billing/kredit (misalnya “insufficient credits” / “credit balance too low”) diperlakukan layak failover, tetapi biasanya tidak bersifat transient. Alih-alih cooldown singkat, OpenClaw menandai profil sebagai **nonaktif** (dengan backoff lebih lama) dan merotasi ke profil/provider berikutnya.

Tidak setiap respons berbentuk billing adalah `402`, dan tidak setiap HTTP `402` masuk
ke sini. OpenClaw mempertahankan teks billing eksplisit dalam jalur billing bahkan saat sebuah
provider mengembalikan `401` atau `403`, tetapi matcher khusus provider tetap
dibatasi pada provider yang memilikinya (misalnya OpenRouter `403 Key limit
exceeded`). Sementara itu error sementara `402` berupa jendela penggunaan dan
limit pengeluaran organisasi/workspace diklasifikasikan sebagai `rate_limit` saat
pesannya tampak dapat diulang (misalnya `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow`, atau `organization spending limit exceeded`).
Error seperti itu tetap berada di jalur cooldown/failover singkat alih-alih jalur
penonaktifan billing yang panjang.

State disimpan di `auth-state.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Default:

- Backoff billing dimulai dari **5 jam**, berlipat ganda per kegagalan billing, dan dibatasi di **24 jam**.
- Penghitung backoff di-reset jika profil tidak gagal selama **24 jam** (dapat dikonfigurasi).
- Retry overloaded mengizinkan **1 rotasi profil provider yang sama** sebelum fallback model.
- Retry overloaded menggunakan backoff **0 md** secara default.

## Fallback model

Jika semua profil untuk sebuah provider gagal, OpenClaw berpindah ke model berikutnya di
`agents.defaults.model.fallbacks`. Ini berlaku untuk kegagalan auth, rate limit, dan
timeout yang menghabiskan rotasi profil (error lain tidak memajukan fallback).

Error overloaded dan rate-limit ditangani lebih agresif daripada cooldown
billing. Secara default, OpenClaw mengizinkan satu retry profil auth pada provider yang sama,
lalu berpindah ke fallback model berikutnya yang dikonfigurasi tanpa menunggu.
Sinyal provider-busy seperti `ModelNotReadyException` masuk ke bucket overloaded itu.
Atur ini dengan `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs`, dan
`auth.cooldowns.rateLimitedProfileRotations`.

Saat run dimulai dengan override model (hook atau CLI), fallback tetap berakhir di
`agents.defaults.model.primary` setelah mencoba fallback yang dikonfigurasi.

### Aturan rantai kandidat

OpenClaw membangun daftar kandidat dari `provider/model` yang saat ini diminta
ditambah fallback yang dikonfigurasi.

Aturan:

- Model yang diminta selalu pertama.
- Fallback eksplisit yang dikonfigurasi dideduplicasi tetapi tidak difilter oleh allowlist model. Fallback ini diperlakukan sebagai maksud operator yang eksplisit.
- Jika run saat ini sudah berada pada fallback yang dikonfigurasi dalam keluarga provider yang sama, OpenClaw tetap menggunakan rantai terkonfigurasi penuh.
- Jika run saat ini berada pada provider yang berbeda dari konfigurasi dan model saat ini tersebut belum menjadi bagian dari rantai fallback yang dikonfigurasi, OpenClaw tidak menambahkan fallback terkonfigurasi yang tidak terkait dari provider lain.
- Saat run dimulai dari override, primary yang dikonfigurasi ditambahkan di akhir agar rantainya dapat kembali menetap ke default normal setelah kandidat sebelumnya habis.

### Error mana yang memajukan fallback

Fallback model berlanjut pada:

- kegagalan auth
- rate limit dan cooldown yang habis
- error overloaded/provider-busy
- error failover berbentuk timeout
- penonaktifan billing
- `LiveSessionModelSwitchError`, yang dinormalisasi menjadi jalur failover agar model persist yang stale tidak membuat loop retry luar
- error lain yang tidak dikenali saat masih ada kandidat yang tersisa

Fallback model tidak berlanjut pada:

- abort eksplisit yang bukan berbentuk timeout/failover
- error context overflow yang harus tetap berada di dalam logika Compaction/retry
  (misalnya `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model`, atau `ollama error: context
length exceeded`)
- error unknown final saat tidak ada kandidat yang tersisa

### Perilaku skip vs probe saat cooldown

Saat setiap profil auth untuk sebuah provider sudah berada dalam cooldown, OpenClaw
tidak otomatis melewati provider itu selamanya. OpenClaw membuat keputusan per kandidat:

- Kegagalan auth persisten langsung melewati seluruh provider.
- Penonaktifan billing biasanya dilewati, tetapi kandidat primary masih dapat diprobe
  dengan throttle agar pemulihan tetap dimungkinkan tanpa restart.
- Kandidat primary dapat diprobe mendekati akhir cooldown, dengan throttle
  per provider.
- Sibling fallback pada provider yang sama dapat dicoba meskipun sedang cooldown ketika
  kegagalannya tampak transient (`rate_limit`, `overloaded`, atau unknown). Ini
  особенно relevan saat rate limit memiliki cakupan model dan model sibling mungkin
  masih dapat pulih segera.
- Probe cooldown transient dibatasi satu per provider per fallback run sehingga
  satu provider tidak menghambat fallback lintas-provider.

## Override sesi dan peralihan model live

Perubahan model sesi adalah state bersama. Runner aktif, perintah `/model`,
pembaruan Compaction/sesi, dan rekonsiliasi sesi live semuanya membaca atau menulis
bagian dari entri sesi yang sama.

Itu berarti retry fallback harus berkoordinasi dengan peralihan model live:

- Hanya perubahan model eksplisit yang didorong pengguna yang menandai live switch tertunda. Itu
  mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang didorong sistem seperti rotasi fallback, override Heartbeat,
  atau Compaction tidak pernah menandai live switch tertunda dengan sendirinya.
- Sebelum retry fallback dimulai, runner balasan mem-persist field override
  fallback yang dipilih ke entri sesi.
- Rekonsiliasi sesi live lebih mengutamakan override sesi yang dipersist daripada
  field model runtime yang stale.
- Jika attempt fallback gagal, runner merollback hanya field override yang
  ditulisnya, dan hanya jika field tersebut masih cocok dengan kandidat gagal itu.

Ini mencegah race klasik:

1. Primary gagal.
2. Kandidat fallback dipilih di memori.
3. Penyimpanan sesi masih menyatakan primary lama.
4. Rekonsiliasi sesi live membaca state sesi stale.
5. Retry dikembalikan ke model lama sebelum attempt fallback
   dimulai.

Override fallback yang dipersist menutup jendela itu, dan rollback yang sempit
menjaga perubahan sesi manual atau runtime yang lebih baru tetap utuh.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail per-attempt yang menjadi sumber log dan
pesan cooldown yang terlihat pengguna:

- provider/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan
  alasan failover serupa)
- status/code opsional
- ringkasan error yang dapat dibaca manusia

Saat semua kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Runner
balasan luar dapat menggunakan ini untuk membangun pesan yang lebih spesifik seperti "semua model
sedang rate-limited sementara" dan menyertakan waktu kedaluwarsa cooldown tercepat saat
diketahui.

Ringkasan cooldown itu sadar-model:

- rate limit dengan cakupan model yang tidak terkait diabaikan untuk rantai
  provider/model yang dicoba
- jika blok yang tersisa adalah rate limit dengan cakupan model yang cocok, OpenClaw
  melaporkan waktu kedaluwarsa cocok terakhir yang masih memblokir model tersebut

## Konfigurasi terkait

Lihat [Konfigurasi Gateway](/id/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- perutean `agents.defaults.imageModel`

Lihat [Models](/id/concepts/models) untuk gambaran umum pemilihan model dan fallback yang lebih luas.
