---
read_when:
    - Mendiagnosis rotasi profil auth, cooldown, atau perilaku fallback model
    - Memperbarui aturan failover untuk profil auth atau model
    - Memahami bagaimana override model sesi berinteraksi dengan percobaan ulang fallback
summary: Cara OpenClaw merotasi profil auth dan melakukan fallback antar model
title: Failover Model
x-i18n:
    generated_at: "2026-04-07T09:13:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: d88821e229610f236bdab3f798d5e8c173f61a77c01017cc87431126bf465e32
    source_path: concepts/model-failover.md
    workflow: 15
---

# Failover model

OpenClaw menangani kegagalan dalam dua tahap:

1. **Rotasi profil auth** di dalam provider saat ini.
2. **Fallback model** ke model berikutnya dalam `agents.defaults.model.fallbacks`.

Dokumen ini menjelaskan aturan runtime dan data yang mendasarinya.

## Alur runtime

Untuk run teks normal, OpenClaw mengevaluasi kandidat dalam urutan ini:

1. Model sesi yang saat ini dipilih.
2. `agents.defaults.model.fallbacks` yang dikonfigurasi secara berurutan.
3. Model utama yang dikonfigurasi di akhir ketika run dimulai dari override.

Di dalam setiap kandidat, OpenClaw mencoba failover profil auth sebelum maju ke
kandidat model berikutnya.

Urutan tingkat tinggi:

1. Selesaikan model sesi aktif dan preferensi profil auth.
2. Bangun rantai kandidat model.
3. Coba provider saat ini dengan aturan rotasi/cooldown profil auth.
4. Jika provider itu habis dengan error yang layak untuk failover, pindah ke
   kandidat model berikutnya.
5. Persistenkan override fallback yang dipilih sebelum percobaan ulang dimulai
   agar pembaca sesi lain melihat provider/model yang sama yang akan digunakan
   runner.
6. Jika kandidat fallback gagal, rollback hanya field override sesi milik
   fallback ketika field tersebut masih cocok dengan kandidat gagal itu.
7. Jika setiap kandidat gagal, lempar `FallbackSummaryError` dengan detail per
   percobaan dan waktu kedaluwarsa cooldown tercepat ketika diketahui.

Ini sengaja lebih sempit daripada "simpan dan pulihkan seluruh sesi". Runner
balasan hanya memersistenkan field pemilihan model yang dimilikinya untuk fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Itu mencegah percobaan ulang fallback yang gagal menimpa mutasi sesi baru yang
tidak terkait, seperti perubahan `/model` manual atau pembaruan rotasi sesi yang
terjadi saat percobaan sedang berjalan.

## Penyimpanan auth (kunci + OAuth)

OpenClaw menggunakan **profil auth** untuk API key dan token OAuth.

- Secret disimpan di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (lama: `~/.openclaw/agent/auth-profiles.json`).
- State perutean auth runtime disimpan di `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfigurasi `auth.profiles` / `auth.order` hanya untuk **metadata + perutean** (tanpa secret).
- File OAuth lama khusus impor: `~/.openclaw/credentials/oauth.json` (diimpor ke `auth-profiles.json` saat pertama kali digunakan).

Detail lebih lanjut: [/concepts/oauth](/id/concepts/oauth)

Jenis kredensial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` untuk beberapa provider)

## ID profil

Login OAuth membuat profil yang berbeda agar beberapa akun dapat hidup berdampingan.

- Default: `provider:default` saat tidak ada email yang tersedia.
- OAuth dengan email: `provider:<email>` (misalnya `google-antigravity:user@gmail.com`).

Profil disimpan di `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` di bawah `profiles`.

## Urutan rotasi

Ketika provider memiliki beberapa profil, OpenClaw memilih urutan seperti ini:

1. **Konfigurasi eksplisit**: `auth.order[provider]` (jika disetel).
2. **Profil yang dikonfigurasi**: `auth.profiles` yang difilter berdasarkan provider.
3. **Profil yang tersimpan**: entri dalam `auth-profiles.json` untuk provider tersebut.

Jika tidak ada urutan eksplisit yang dikonfigurasi, OpenClaw menggunakan urutan round‑robin:

- **Kunci utama:** tipe profil (**OAuth sebelum API key**).
- **Kunci sekunder:** `usageStats.lastUsed` (yang paling lama digunakan lebih dulu, dalam setiap tipe).
- **Profil cooldown/dinonaktifkan** dipindahkan ke akhir, diurutkan menurut waktu kedaluwarsa tercepat.

### Keketatan sesi (ramah cache)

OpenClaw **menyematkan profil auth yang dipilih per sesi** untuk menjaga cache provider tetap hangat.
OpenClaw **tidak** merotasi pada setiap permintaan. Profil yang disematkan digunakan kembali sampai:

- sesi di-reset (`/new` / `/reset`)
- compaction selesai (jumlah compaction bertambah)
- profil berada dalam cooldown/dinonaktifkan

Pemilihan manual melalui `/model …@<profileId>` menetapkan **override pengguna** untuk sesi itu
dan tidak dirotasi otomatis sampai sesi baru dimulai.

Profil yang disematkan otomatis (dipilih oleh router sesi) diperlakukan sebagai **preferensi**:
profil tersebut dicoba lebih dulu, tetapi OpenClaw dapat merotasi ke profil lain pada batas laju/timeout.
Profil yang disematkan pengguna tetap terkunci ke profil itu; jika gagal dan fallback model
dikonfigurasi, OpenClaw berpindah ke model berikutnya alih-alih mengganti profil.

### Mengapa OAuth bisa "terlihat hilang"

Jika Anda memiliki profil OAuth dan profil API key untuk provider yang sama, round‑robin dapat berpindah di antara keduanya antar pesan kecuali disematkan. Untuk memaksa satu profil:

- Sematkan dengan `auth.order[provider] = ["provider:profileId"]`, atau
- Gunakan override per sesi melalui `/model …` dengan override profil (jika didukung oleh permukaan UI/chat Anda).

## Cooldown

Ketika profil gagal karena error auth/batas laju (atau timeout yang terlihat
seperti batas laju), OpenClaw menandainya dalam cooldown dan berpindah ke profil berikutnya.
Bucket batas laju itu lebih luas daripada sekadar `429`: itu juga mencakup pesan
provider seperti `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted`, dan batas jendela penggunaan berkala seperti
`weekly/monthly limit reached`.
Error format/permintaan tidak valid (misalnya kegagalan validasi ID pemanggilan tool
Cloud Code Assist) diperlakukan layak untuk failover dan menggunakan cooldown yang sama.
Error stop-reason yang kompatibel dengan OpenAI seperti `Unhandled stop reason: error`,
`stop reason: error`, dan `reason: error` diklasifikasikan sebagai sinyal
timeout/failover.
Teks server generik yang dicakup provider juga dapat masuk ke bucket timeout itu ketika
sumbernya cocok dengan pola transien yang diketahui. Misalnya, teks mentah Anthropic
`An unknown error occurred` dan payload JSON `api_error` dengan teks server transien
seperti `internal server error`, `unknown error, 520`, `upstream error`,
atau `backend error` diperlakukan sebagai timeout yang layak untuk failover. Teks upstream
generik khusus OpenRouter seperti `Provider returned error` mentah juga diperlakukan sebagai
timeout hanya ketika konteks providernya benar-benar OpenRouter. Teks fallback internal
generik seperti `LLM request failed with an unknown error.` tetap konservatif dan tidak
memicu failover dengan sendirinya.

Cooldown batas laju juga dapat dicakup ke model:

- OpenClaw mencatat `cooldownModel` untuk kegagalan batas laju ketika id model
  yang gagal diketahui.
- Model saudara pada provider yang sama masih dapat dicoba ketika cooldown
  dicakup ke model yang berbeda.
- Jendela billing/dinonaktifkan tetap memblokir seluruh profil di semua model.

Cooldown menggunakan backoff eksponensial:

- 1 menit
- 5 menit
- 25 menit
- 1 jam (batas maksimum)

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

Kegagalan billing/kredit (misalnya “insufficient credits” / “credit balance too low”) diperlakukan layak untuk failover, tetapi biasanya tidak bersifat sementara. Alih-alih cooldown singkat, OpenClaw menandai profil sebagai **dinonaktifkan** (dengan backoff lebih lama) dan merotasi ke profil/provider berikutnya.

Tidak setiap respons yang tampak seperti billing adalah `402`, dan tidak setiap HTTP `402` masuk
ke sini. OpenClaw mempertahankan teks billing eksplisit di jalur billing bahkan ketika
provider mengembalikan `401` atau `403`, tetapi matcher khusus provider tetap
dicakup ke provider yang memilikinya (misalnya OpenRouter `403 Key limit
exceeded`). Sementara itu error jendela penggunaan `402` sementara dan
batas pembelanjaan organisasi/ruang kerja diklasifikasikan sebagai `rate_limit` ketika
pesannya tampak dapat dicoba lagi (misalnya `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow`, atau `organization spending limit exceeded`).
Itu tetap berada pada jalur cooldown/failover singkat alih-alih jalur
penonaktifan billing panjang.

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

- Backoff billing dimulai pada **5 jam**, berlipat ganda per kegagalan billing, dan dibatasi pada **24 jam**.
- Penghitung backoff di-reset jika profil tidak gagal selama **24 jam** (dapat dikonfigurasi).
- Percobaan ulang overloaded mengizinkan **1 rotasi profil provider yang sama** sebelum fallback model.
- Percobaan ulang overloaded menggunakan backoff **0 md** secara default.

## Fallback model

Jika semua profil untuk provider gagal, OpenClaw berpindah ke model berikutnya di
`agents.defaults.model.fallbacks`. Ini berlaku untuk kegagalan auth, batas laju, dan
timeout yang menghabiskan rotasi profil (error lain tidak memajukan fallback).

Error overloaded dan batas laju ditangani lebih agresif daripada cooldown billing.
Secara default, OpenClaw mengizinkan satu percobaan ulang profil auth provider yang sama,
lalu beralih ke fallback model terkonfigurasi berikutnya tanpa menunggu.
Sinyal provider sibuk seperti `ModelNotReadyException` masuk ke bucket overloaded
tersebut. Atur ini dengan `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs`, dan
`auth.cooldowns.rateLimitedProfileRotations`.

Ketika run dimulai dengan override model (hooks atau CLI), fallback tetap berakhir di
`agents.defaults.model.primary` setelah mencoba fallback terkonfigurasi apa pun.

### Aturan rantai kandidat

OpenClaw membangun daftar kandidat dari `provider/model` yang sedang diminta
ditambah fallback yang dikonfigurasi.

Aturan:

- Model yang diminta selalu pertama.
- Fallback eksplisit yang dikonfigurasi dihapus duplikasinya tetapi tidak difilter oleh allowlist
  model. Itu diperlakukan sebagai niat operator yang eksplisit.
- Jika run saat ini sudah berada pada fallback terkonfigurasi dalam keluarga provider yang sama,
  OpenClaw tetap menggunakan rantai terkonfigurasi penuh.
- Jika run saat ini berada pada provider yang berbeda dari konfigurasi dan model saat ini
  belum menjadi bagian dari rantai fallback terkonfigurasi, OpenClaw tidak
  menambahkan fallback terkonfigurasi yang tidak terkait dari provider lain.
- Ketika run dimulai dari override, primary yang dikonfigurasi ditambahkan di
  akhir agar rantai dapat kembali ke default normal setelah kandidat
  sebelumnya habis.

### Error mana yang memajukan fallback

Fallback model berlanjut pada:

- kegagalan auth
- batas laju dan habisnya cooldown
- error overloaded/provider sibuk
- error failover berbentuk timeout
- penonaktifan billing
- `LiveSessionModelSwitchError`, yang dinormalisasi ke jalur failover agar
  model persisten yang usang tidak membuat loop percobaan ulang luar
- error tidak dikenali lainnya ketika masih ada kandidat tersisa

Fallback model tidak berlanjut pada:

- pembatalan eksplisit yang tidak berbentuk timeout/failover
- error overflow konteks yang harus tetap berada dalam logika compaction/percobaan ulang
  (misalnya `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model`, atau `ollama error: context
length exceeded`)
- error tak dikenal terakhir ketika tidak ada kandidat tersisa

### Perilaku lewati cooldown vs probe

Ketika setiap profil auth untuk provider sudah berada dalam cooldown, OpenClaw
tidak otomatis melewati provider itu selamanya. OpenClaw membuat keputusan per kandidat:

- Kegagalan auth persisten langsung melewati seluruh provider.
- Penonaktifan billing biasanya dilewati, tetapi kandidat primary masih dapat diprobe
  dengan throttle agar pemulihan tetap mungkin tanpa restart.
- Kandidat primary dapat diprobe mendekati akhir cooldown, dengan throttle per provider.
- Model saudara fallback provider yang sama dapat dicoba meskipun sedang cooldown ketika
  kegagalannya tampak transien (`rate_limit`, `overloaded`, atau tidak diketahui). Ini
  terutama relevan ketika batas laju dicakup ke model dan model saudara mungkin
  masih dapat pulih segera.
- Probe cooldown transien dibatasi satu per provider per run fallback agar
  satu provider tidak menghambat fallback lintas provider.

## Override sesi dan peralihan model langsung

Perubahan model sesi adalah state bersama. Runner aktif, perintah `/model`,
pembaruan compaction/sesi, dan rekonsiliasi sesi langsung semuanya membaca atau menulis
bagian dari entri sesi yang sama.

Artinya percobaan ulang fallback harus berkoordinasi dengan peralihan model langsung:

- Hanya perubahan model eksplisit yang digerakkan pengguna yang menandai live switch tertunda. Itu
  mencakup `/model`, `session_status(model=...)`, dan `sessions.patch`.
- Perubahan model yang digerakkan sistem seperti rotasi fallback, override heartbeat,
  atau compaction tidak pernah menandai live switch tertunda dengan sendirinya.
- Sebelum percobaan ulang fallback dimulai, runner balasan memersistenkan field
  override fallback yang dipilih ke entri sesi.
- Rekonsiliasi sesi langsung lebih mengutamakan override sesi yang dipersistenkan daripada
  field model runtime yang usang.
- Jika percobaan fallback gagal, runner me-roll back hanya field override yang
  ditulisnya, dan hanya jika field itu masih cocok dengan kandidat gagal tersebut.

Ini mencegah race condition klasik:

1. Primary gagal.
2. Kandidat fallback dipilih di memori.
3. Penyimpanan sesi masih menyatakan primary lama.
4. Rekonsiliasi sesi langsung membaca state sesi yang usang.
5. Percobaan ulang dibenturkan kembali ke model lama sebelum percobaan fallback
   dimulai.

Override fallback yang dipersistenkan menutup celah itu, dan rollback yang sempit
menjaga perubahan sesi manual atau runtime yang lebih baru tetap utuh.

## Observabilitas dan ringkasan kegagalan

`runWithModelFallback(...)` mencatat detail per percobaan yang menjadi masukan untuk log dan
pesan cooldown yang terlihat pengguna:

- provider/model yang dicoba
- alasan (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found`, dan
  alasan failover serupa)
- status/kode opsional
- ringkasan error yang dapat dibaca manusia

Ketika setiap kandidat gagal, OpenClaw melempar `FallbackSummaryError`. Runner
balasan luar dapat menggunakan ini untuk membangun pesan yang lebih spesifik seperti "semua model
sementara terkena rate limit" dan menyertakan waktu kedaluwarsa cooldown tercepat ketika diketahui.

Ringkasan cooldown itu sadar model:

- batas laju yang dicakup model tetapi tidak terkait diabaikan untuk rantai
  provider/model yang dicoba
- jika blok yang tersisa adalah batas laju yang dicakup model yang cocok, OpenClaw
  melaporkan waktu kedaluwarsa cocok terakhir yang masih memblokir model itu

## Konfigurasi terkait

Lihat [Konfigurasi Gateway](/id/gateway/configuration) untuk:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- perutean `agents.defaults.imageModel`

Lihat [Model](/id/concepts/models) untuk gambaran umum yang lebih luas tentang pemilihan model dan fallback.
