---
read_when:
    - Anda ingin mengurangi biaya token prompt dengan retensi cache
    - Anda memerlukan perilaku cache per agen dalam penyiapan multi-agen
    - Anda sedang menyesuaikan Heartbeat dan pemangkasan cache-ttl secara bersamaan
summary: Knob cache prompt, urutan merge, perilaku penyedia, dan pola penyesuaian
title: Cache prompt
x-i18n:
    generated_at: "2026-04-25T13:55:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

Cache prompt berarti penyedia model dapat menggunakan kembali prefiks prompt yang tidak berubah (biasanya instruksi system/developer dan konteks stabil lainnya) di berbagai giliran alih-alih memproses ulang semuanya setiap saat. OpenClaw menormalkan penggunaan penyedia menjadi `cacheRead` dan `cacheWrite` ketika API upstream mengekspos penghitung tersebut secara langsung.

Surface status juga dapat memulihkan penghitung cache dari log penggunaan transkrip terbaru
ketika snapshot sesi langsung tidak memilikinya, sehingga `/status` dapat tetap
menampilkan baris cache setelah kehilangan sebagian metadata sesi. Nilai cache langsung nonzero yang ada
tetap diprioritaskan dibanding nilai fallback transkrip.

Mengapa ini penting: biaya token lebih rendah, respons lebih cepat, dan performa yang lebih dapat diprediksi untuk sesi yang berjalan lama. Tanpa caching, prompt yang berulang membayar biaya prompt penuh pada setiap giliran meskipun sebagian besar input tidak berubah.

Bagian di bawah ini mencakup setiap knob terkait cache yang memengaruhi penggunaan ulang prompt dan biaya token.

Referensi penyedia:

- Prompt caching Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Prompt caching OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header API dan ID permintaan OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID permintaan dan error Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Knob utama

### `cacheRetention` (default global, model, dan per agen)

Atur retensi cache sebagai default global untuk semua model:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Override per model:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Override per agen:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Urutan merge konfigurasi:

1. `agents.defaults.params` (default global — berlaku untuk semua model)
2. `agents.defaults.models["provider/model"].params` (override per model)
3. `agents.list[].params` (id agen yang cocok; override berdasarkan key)

### `contextPruning.mode: "cache-ttl"`

Memangkas konteks hasil tool lama setelah jendela TTL cache agar permintaan setelah idle tidak meng-cache ulang riwayat yang terlalu besar.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Lihat [Pemangkasan Sesi](/id/concepts/session-pruning) untuk perilaku lengkap.

### Menjaga tetap hangat dengan Heartbeat

Heartbeat dapat menjaga jendela cache tetap hangat dan mengurangi penulisan cache berulang setelah jeda idle.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat per agen didukung di `agents.list[].heartbeat`.

## Perilaku penyedia

### Anthropic (API langsung)

- `cacheRetention` didukung.
- Dengan profil auth API key Anthropic, OpenClaw menginisialisasi `cacheRetention: "short"` untuk referensi model Anthropic saat tidak diatur.
- Respons Anthropic native Messages mengekspos `cache_read_input_tokens` dan `cache_creation_input_tokens`, sehingga OpenClaw dapat menampilkan `cacheRead` dan `cacheWrite`.
- Untuk permintaan Anthropic native, `cacheRetention: "short"` dipetakan ke cache ephemeral default 5 menit, dan `cacheRetention: "long"` ditingkatkan ke TTL 1 jam hanya pada host langsung `api.anthropic.com`.

### OpenAI (API langsung)

- Prompt caching bersifat otomatis pada model terbaru yang didukung. OpenClaw tidak perlu menyisipkan penanda cache tingkat blok.
- OpenClaw menggunakan `prompt_cache_key` untuk menjaga routing cache tetap stabil antar giliran dan menggunakan `prompt_cache_retention: "24h"` hanya ketika `cacheRetention: "long"` dipilih pada host OpenAI langsung.
- Penyedia Completions yang kompatibel dengan OpenAI menerima `prompt_cache_key` hanya ketika konfigurasi modelnya secara eksplisit mengatur `compat.supportsPromptCacheKey: true`; `cacheRetention: "none"` tetap menekannya.
- Respons OpenAI mengekspos token prompt yang di-cache melalui `usage.prompt_tokens_details.cached_tokens` (atau `input_tokens_details.cached_tokens` pada event Responses API). OpenClaw memetakannya ke `cacheRead`.
- OpenAI tidak mengekspos penghitung token penulisan cache terpisah, jadi `cacheWrite` tetap `0` pada jalur OpenAI meskipun penyedia sedang memanaskan cache.
- OpenAI mengembalikan header tracing dan rate-limit yang berguna seperti `x-request-id`, `openai-processing-ms`, dan `x-ratelimit-*`, tetapi perhitungan cache-hit sebaiknya berasal dari payload penggunaan, bukan dari header.
- Dalam praktiknya, OpenAI sering berperilaku seperti cache prefiks awal alih-alih penggunaan ulang riwayat penuh bergerak ala Anthropic. Giliran teks prefiks panjang yang stabil dapat mencapai plateau sekitar `4864` cached token dalam probe langsung saat ini, sementara transkrip yang berat tool atau bergaya MCP sering mencapai plateau sekitar `4608` cached token bahkan pada pengulangan yang persis sama.

### Anthropic Vertex

- Model Anthropic di Vertex AI (`anthropic-vertex/*`) mendukung `cacheRetention` dengan cara yang sama seperti Anthropic langsung.
- `cacheRetention: "long"` dipetakan ke TTL prompt-cache 1 jam yang nyata pada endpoint Vertex AI.
- Default retensi cache untuk `anthropic-vertex` sama dengan default Anthropic langsung.
- Permintaan Vertex dirutekan melalui pembentukan cache yang sadar batas sehingga penggunaan ulang cache tetap selaras dengan yang benar-benar diterima penyedia.

### Amazon Bedrock

- Referensi model Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) mendukung pass-through `cacheRetention` eksplisit.
- Model Bedrock non-Anthropic dipaksa menjadi `cacheRetention: "none"` saat runtime.

### Model OpenRouter

Untuk referensi model `openrouter/anthropic/*`, OpenClaw menyisipkan
`cache_control` Anthropic pada blok prompt system/developer untuk meningkatkan penggunaan ulang
prompt-cache hanya ketika permintaan masih menargetkan rute OpenRouter yang terverifikasi
(`openrouter` pada endpoint default-nya, atau penyedia/base URL apa pun yang mengarah
ke `openrouter.ai`).

Untuk referensi model `openrouter/deepseek/*`, `openrouter/moonshot*/*`, dan `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` diperbolehkan karena OpenRouter
menangani prompt caching di sisi penyedia secara otomatis. OpenClaw tidak menyisipkan
penanda `cache_control` Anthropic ke dalam permintaan tersebut.

Pembentukan cache DeepSeek bersifat best-effort dan dapat memakan beberapa detik. Follow-up
langsung mungkin masih menampilkan `cached_tokens: 0`; verifikasi dengan permintaan ulang
prefiks yang sama setelah jeda singkat dan gunakan `usage.prompt_tokens_details.cached_tokens`
sebagai sinyal cache-hit.

Jika Anda mengarahkan ulang model ke URL proxy kompatibel OpenAI yang arbitrer, OpenClaw
berhenti menyisipkan penanda cache Anthropic khusus OpenRouter tersebut.

### Penyedia lain

Jika penyedia tidak mendukung mode cache ini, `cacheRetention` tidak berpengaruh.

### API langsung Google Gemini

- Transport Gemini langsung (`api: "google-generative-ai"`) melaporkan cache hit
  melalui `cachedContentTokenCount` upstream; OpenClaw memetakannya ke `cacheRead`.
- Ketika `cacheRetention` diatur pada model Gemini langsung, OpenClaw secara otomatis
  membuat, menggunakan kembali, dan menyegarkan resource `cachedContents` untuk system prompt
  pada eksekusi Google AI Studio. Ini berarti Anda tidak lagi perlu membuat
  handle cached-content secara manual sebelumnya.
- Anda tetap dapat meneruskan handle cached-content Gemini yang sudah ada
  sebagai `params.cachedContent` (atau `params.cached_content` lama) pada
  model yang dikonfigurasi.
- Ini terpisah dari prompt-prefix caching Anthropic/OpenAI. Untuk Gemini,
  OpenClaw mengelola resource `cachedContents` native milik penyedia alih-alih
  menyisipkan penanda cache ke dalam permintaan.

### Penggunaan JSON Gemini CLI

- Output JSON Gemini CLI juga dapat menampilkan cache hit melalui `stats.cached`;
  OpenClaw memetakannya ke `cacheRead`.
- Jika CLI menghilangkan nilai `stats.input` langsung, OpenClaw menurunkan token input
  dari `stats.input_tokens - stats.cached`.
- Ini hanya normalisasi penggunaan. Ini tidak berarti OpenClaw membuat
  penanda prompt-cache ala Anthropic/OpenAI untuk Gemini CLI.

## Batas cache system prompt

OpenClaw membagi system prompt menjadi **prefiks stabil** dan **sufiks volatil**
yang dipisahkan oleh batas cache-prefix internal. Konten di atas
batas (definisi tool, metadata Skills, file workspace, dan konteks
yang relatif statis lainnya) diurutkan agar tetap identik byte demi byte di berbagai giliran.
Konten di bawah batas (misalnya `HEARTBEAT.md`, stempel waktu runtime, dan
metadata per giliran lainnya) dibiarkan berubah tanpa membatalkan prefiks
yang di-cache.

Pilihan desain utama:

- File konteks proyek workspace yang stabil diurutkan sebelum `HEARTBEAT.md` sehingga
  perubahan heartbeat tidak merusak prefiks stabil.
- Batas diterapkan di seluruh pembentukan transport keluarga Anthropic, keluarga OpenAI, Google, dan
  CLI sehingga semua penyedia yang didukung mendapat manfaat dari stabilitas prefiks yang sama.
- Permintaan Codex Responses dan Anthropic Vertex dirutekan melalui
  pembentukan cache yang sadar batas sehingga penggunaan ulang cache tetap selaras dengan yang benar-benar diterima penyedia.
- Fingerprint system prompt dinormalisasi (whitespace, line ending,
  konteks yang ditambahkan hook, pengurutan kapabilitas runtime) sehingga
  prompt yang secara semantik tidak berubah berbagi KV/cache antar giliran.

Jika Anda melihat lonjakan `cacheWrite` yang tidak diharapkan setelah perubahan konfigurasi atau workspace,
periksa apakah perubahan tersebut berada di atas atau di bawah batas cache. Memindahkan
konten volatil ke bawah batas (atau menstabilkannya) sering menyelesaikan
masalah.

## Pengaman stabilitas cache OpenClaw

OpenClaw juga menjaga beberapa bentuk payload yang sensitif terhadap cache tetap deterministik sebelum
permintaan mencapai penyedia:

- Katalog tool MCP bundel diurutkan secara deterministik sebelum registrasi
  tool, sehingga perubahan urutan `listTools()` tidak mengubah blok tool dan
  merusak prefiks prompt-cache.
- Sesi lama dengan blok gambar yang dipersistenkan mempertahankan **3 giliran selesai terbaru**
  tetap utuh; blok gambar lama yang sudah diproses dapat
  diganti dengan penanda agar follow-up yang berat gambar tidak terus mengirim ulang
  payload basi yang besar.

## Pola penyesuaian

### Trafik campuran (default yang direkomendasikan)

Pertahankan baseline jangka panjang pada agen utama Anda, nonaktifkan caching pada agen notifikasi yang bursty:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Baseline yang mengutamakan biaya

- Atur baseline `cacheRetention: "short"`.
- Aktifkan `contextPruning.mode: "cache-ttl"`.
- Pertahankan heartbeat di bawah TTL Anda hanya untuk agen yang mendapat manfaat dari cache hangat.

## Diagnostik cache

OpenClaw mengekspos diagnostik cache-trace khusus untuk eksekusi agen tersemat.

Untuk diagnostik normal yang menghadap pengguna, `/status` dan ringkasan penggunaan lainnya dapat menggunakan
entri penggunaan transkrip terbaru sebagai sumber fallback untuk `cacheRead` /
`cacheWrite` ketika entri sesi langsung tidak memiliki penghitung tersebut.

## Uji regresi langsung

OpenClaw mempertahankan satu gate regresi cache langsung gabungan untuk prefiks berulang, giliran tool, giliran gambar, transkrip tool bergaya MCP, dan kontrol tanpa cache Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Jalankan gate langsung sempit dengan:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

File baseline menyimpan angka langsung terbaru yang teramati beserta ambang regresi khusus penyedia yang digunakan oleh pengujian.
Runner juga menggunakan ID sesi dan namespace prompt baru untuk setiap eksekusi agar status cache sebelumnya tidak mencemari sampel regresi saat ini.

Pengujian ini secara sengaja tidak menggunakan kriteria keberhasilan yang identik di semua penyedia.

### Ekspektasi langsung Anthropic

- Harapkan penulisan warmup eksplisit melalui `cacheWrite`.
- Harapkan penggunaan ulang riwayat hampir penuh pada giliran berulang karena kontrol cache Anthropic memajukan breakpoint cache sepanjang percakapan.
- Asersi langsung saat ini masih menggunakan ambang hit-rate tinggi untuk jalur stabil, tool, dan gambar.

### Ekspektasi langsung OpenAI

- Harapkan hanya `cacheRead`. `cacheWrite` tetap `0`.
- Perlakukan penggunaan ulang cache pada giliran berulang sebagai plateau khusus penyedia, bukan sebagai penggunaan ulang riwayat penuh bergerak ala Anthropic.
- Asersi langsung saat ini menggunakan pemeriksaan ambang konservatif yang diturunkan dari perilaku langsung yang diamati pada `gpt-5.4-mini`:
  - prefiks stabil: `cacheRead >= 4608`, hit rate `>= 0.90`
  - transkrip tool: `cacheRead >= 4096`, hit rate `>= 0.85`
  - transkrip gambar: `cacheRead >= 3840`, hit rate `>= 0.82`
  - transkrip bergaya MCP: `cacheRead >= 4096`, hit rate `>= 0.85`

Verifikasi langsung gabungan terbaru pada 2026-04-04 menghasilkan:

- prefiks stabil: `cacheRead=4864`, hit rate `0.966`
- transkrip tool: `cacheRead=4608`, hit rate `0.896`
- transkrip gambar: `cacheRead=4864`, hit rate `0.954`
- transkrip bergaya MCP: `cacheRead=4608`, hit rate `0.891`

Waktu wall-clock lokal terbaru untuk gate gabungan adalah sekitar `88s`.

Mengapa asersinya berbeda:

- Anthropic mengekspos breakpoint cache eksplisit dan penggunaan ulang riwayat percakapan yang bergerak.
- Prompt caching OpenAI tetap sensitif terhadap prefiks yang persis sama, tetapi prefiks efektif yang dapat digunakan ulang dalam trafik Responses langsung dapat mencapai plateau lebih awal daripada prompt penuh.
- Karena itu, membandingkan Anthropic dan OpenAI dengan satu ambang persentase lintas penyedia akan menciptakan regresi palsu.

### Konfigurasi `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # opsional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Default:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Toggle env (debugging sekali pakai)

- `OPENCLAW_CACHE_TRACE=1` mengaktifkan cache tracing.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` menimpa jalur output.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` mengaktifkan/menonaktifkan perekaman payload pesan penuh.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` mengaktifkan/menonaktifkan perekaman teks prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` mengaktifkan/menonaktifkan perekaman system prompt.

### Yang perlu diperiksa

- Event cache trace berbentuk JSONL dan mencakup snapshot bertahap seperti `session:loaded`, `prompt:before`, `stream:context`, dan `session:after`.
- Dampak token cache per giliran terlihat pada surface penggunaan normal melalui `cacheRead` dan `cacheWrite` (misalnya `/usage full` dan ringkasan penggunaan sesi).
- Untuk Anthropic, harapkan `cacheRead` dan `cacheWrite` ketika caching aktif.
- Untuk OpenAI, harapkan `cacheRead` pada cache hit dan `cacheWrite` tetap `0`; OpenAI tidak menerbitkan field token cache-write terpisah.
- Jika Anda memerlukan tracing permintaan, catat ID permintaan dan header rate-limit secara terpisah dari metrik cache. Output cache-trace OpenClaw saat ini berfokus pada bentuk prompt/sesi dan penggunaan token yang dinormalisasi, bukan header respons penyedia mentah.

## Pemecahan masalah cepat

- `cacheWrite` tinggi pada sebagian besar giliran: periksa input system prompt yang volatil dan verifikasi model/penyedia mendukung pengaturan cache Anda.
- `cacheWrite` tinggi pada Anthropic: sering berarti breakpoint cache berada pada konten yang berubah di setiap permintaan.
- `cacheRead` OpenAI rendah: verifikasi prefiks stabil berada di depan, prefiks berulang setidaknya 1024 token, dan `prompt_cache_key` yang sama digunakan ulang untuk giliran yang seharusnya berbagi cache.
- Tidak ada efek dari `cacheRetention`: pastikan key model cocok dengan `agents.defaults.models["provider/model"]`.
- Permintaan Bedrock Nova/Mistral dengan pengaturan cache: perilaku runtime yang dipaksa ke `none` adalah hal yang diharapkan.

Dokumentasi terkait:

- [Anthropic](/id/providers/anthropic)
- [Penggunaan token dan biaya](/id/reference/token-use)
- [Pemangkasan sesi](/id/concepts/session-pruning)
- [Referensi konfigurasi Gateway](/id/gateway/configuration-reference)

## Terkait

- [Penggunaan token dan biaya](/id/reference/token-use)
- [Penggunaan API dan biaya](/id/reference/api-usage-costs)
