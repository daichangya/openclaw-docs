---
read_when:
    - Anda ingin memahami fitur mana yang mungkin memanggil API berbayar
    - Anda perlu mengaudit kunci, biaya, dan visibilitas penggunaan
    - Anda sedang menjelaskan pelaporan biaya /status atau /usage
summary: Audit apa saja yang dapat menghabiskan biaya, kunci mana yang digunakan, dan cara melihat penggunaan
title: Penggunaan dan Biaya API
x-i18n:
    generated_at: "2026-04-07T09:19:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab6eefcde9ac014df6cdda7aaa77ef48f16936ab12eaa883d9fe69425a31a2dd
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Penggunaan & biaya API

Dokumen ini mencantumkan **fitur yang dapat memanggil kunci API** dan tempat biayanya muncul. Dokumen ini berfokus pada
fitur OpenClaw yang dapat menghasilkan penggunaan provider atau panggilan API berbayar.

## Tempat biaya muncul (chat + CLI)

**Snapshot biaya per sesi**

- `/status` menampilkan model sesi saat ini, penggunaan konteks, dan token respons terakhir.
- Jika model menggunakan **autentikasi kunci API**, `/status` juga menampilkan **perkiraan biaya** untuk balasan terakhir.
- Jika metadata sesi langsung minim, `/status` dapat memulihkan penghitung
  token/cache dan label model runtime aktif dari entri penggunaan transkrip
  terbaru. Nilai langsung nonzero yang sudah ada tetap diprioritaskan, dan total
  transkrip berukuran prompt dapat menang ketika total tersimpan tidak ada atau lebih kecil.

**Footer biaya per pesan**

- `/usage full` menambahkan footer penggunaan ke setiap balasan, termasuk **perkiraan biaya** (hanya kunci API).
- `/usage tokens` hanya menampilkan token; alur OAuth/token bergaya langganan dan CLI menyembunyikan biaya dalam dolar.
- Catatan Gemini CLI: ketika CLI mengembalikan output JSON, OpenClaw membaca penggunaan dari
  `stats`, menormalkan `stats.cached` menjadi `cacheRead`, dan menurunkan token input
  dari `stats.input_tokens - stats.cached` bila diperlukan.

Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI bergaya OpenClaw kini
diizinkan lagi, jadi OpenClaw menganggap penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai
hal yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
Anthropic masih tidak mengekspos perkiraan dolar per pesan yang dapat ditampilkan OpenClaw
di `/usage full`.

**Jendela penggunaan CLI (kuota provider)**

- `openclaw status --usage` dan `openclaw channels list` menampilkan **jendela penggunaan**
  provider (snapshot kuota, bukan biaya per pesan).
- Output yang dapat dibaca manusia dinormalkan menjadi `X% left` di seluruh provider.
- Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.
- Catatan MiniMax: field mentah `usage_percent` / `usagePercent` berarti kuota
  tersisa, jadi OpenClaw membalikkannya sebelum ditampilkan. Field berbasis jumlah tetap diutamakan
  saat tersedia. Jika provider mengembalikan `model_remains`, OpenClaw memprioritaskan entri model chat,
  menurunkan label jendela dari timestamp bila diperlukan, dan
  menyertakan nama model dalam label paket.
- Autentikasi penggunaan untuk jendela kuota tersebut berasal dari hook khusus provider jika
  tersedia; jika tidak, OpenClaw kembali mencocokkan
  kredensial OAuth/kunci API dari profil autentikasi, env, atau konfigurasi.

Lihat [Penggunaan token & biaya](/id/reference/token-use) untuk detail dan contoh.

## Cara kunci ditemukan

OpenClaw dapat mengambil kredensial dari:

- **Profil autentikasi** (per agen, disimpan di `auth-profiles.json`).
- **Variabel lingkungan** (mis. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfigurasi** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) yang dapat mengekspor kunci ke env proses skill.

## Fitur yang dapat menghabiskan kunci

### 1) Respons model inti (chat + tool)

Setiap balasan atau pemanggilan tool menggunakan **provider model saat ini** (OpenAI, Anthropic, dll.). Ini adalah
sumber utama penggunaan dan biaya.

Ini juga mencakup provider terhosting bergaya langganan yang tetap menagih di luar
UI lokal OpenClaw, seperti **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, dan
jalur login Claude OpenClaw milik Anthropic dengan **Extra Usage** diaktifkan.

Lihat [Model](/id/providers/models) untuk konfigurasi harga dan [Penggunaan token & biaya](/id/reference/token-use) untuk tampilan.

### 2) Pemahaman media (audio/gambar/video)

Media masuk dapat diringkas/ditranskripsikan sebelum balasan dijalankan. Ini menggunakan API model/provider.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Gambar: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Lihat [Pemahaman media](/id/nodes/media-understanding).

### 3) Pembuatan gambar dan video

Kapabilitas pembuatan bersama juga dapat menghabiskan kunci provider:

- Pembuatan gambar: OpenAI / Google / fal / MiniMax
- Pembuatan video: Qwen

Pembuatan gambar dapat menyimpulkan default provider yang didukung autentikasi ketika
`agents.defaults.imageGenerationModel` tidak diatur. Pembuatan video saat ini
memerlukan `agents.defaults.videoGenerationModel` yang eksplisit seperti
`qwen/wan2.6-t2v`.

Lihat [Pembuatan gambar](/id/tools/image-generation), [Qwen Cloud](/id/providers/qwen),
dan [Model](/id/concepts/models).

### 4) Embedding memori + pencarian semantik

Pencarian memori semantik menggunakan **API embedding** saat dikonfigurasi untuk provider jarak jauh:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "ollama"` → embedding Ollama (lokal/self-hosted; biasanya tidak ada penagihan API terhosting)
- Fallback opsional ke provider jarak jauh jika embedding lokal gagal

Anda dapat tetap lokal dengan `memorySearch.provider = "local"` (tanpa penggunaan API).

Lihat [Memori](/id/concepts/memory).

### 5) Tool web search

`web_search` dapat menimbulkan biaya penggunaan tergantung pada provider Anda:

- **Brave Search API**: `BRAVE_API_KEY` atau `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` atau `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` atau `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` atau `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, atau `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, atau `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: default-nya tanpa kunci, tetapi memerlukan host Ollama yang dapat dijangkau plus `ollama signin`; juga dapat menggunakan ulang autentikasi bearer provider Ollama normal saat host membutuhkannya
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, atau `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` atau `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback tanpa kunci (tanpa penagihan API, tetapi tidak resmi dan berbasis HTML)
- **SearXNG**: `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl` (tanpa kunci/self-hosted; tanpa penagihan API terhosting)

Jalur provider legacy `tools.web.search.*` masih dimuat melalui shim kompatibilitas sementara, tetapi bukan lagi permukaan konfigurasi yang direkomendasikan.

**Kredit gratis Brave Search:** Setiap paket Brave menyertakan kredit gratis \$5/bulan yang diperbarui
setiap bulan. Paket Search berbiaya \$5 per 1.000 permintaan, sehingga kredit tersebut mencakup
1.000 permintaan/bulan tanpa biaya. Atur batas penggunaan Anda di dashboard Brave
untuk menghindari biaya tak terduga.

Lihat [Tool web](/id/tools/web).

### 5) Tool web fetch (Firecrawl)

`web_fetch` dapat memanggil **Firecrawl** saat kunci API tersedia:

- `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webFetch.apiKey`

Jika Firecrawl tidak dikonfigurasi, tool akan fallback ke fetch langsung + readability (tanpa API berbayar).

Lihat [Tool web](/id/tools/web).

### 6) Snapshot penggunaan provider (status/health)

Beberapa perintah status memanggil **endpoint penggunaan provider** untuk menampilkan jendela kuota atau kesehatan autentikasi.
Ini biasanya panggilan ber-volume rendah tetapi tetap mengenai API provider:

- `openclaw status --usage`
- `openclaw models status --json`

Lihat [CLI Models](/cli/models).

### 7) Ringkasan perlindungan compaction

Perlindungan compaction dapat merangkum riwayat sesi menggunakan **model saat ini**, yang
memanggil API provider ketika dijalankan.

Lihat [Manajemen sesi + compaction](/id/reference/session-management-compaction).

### 8) Pemindaian / probe model

`openclaw models scan` dapat melakukan probe pada model OpenRouter dan menggunakan `OPENROUTER_API_KEY` saat
probe diaktifkan.

Lihat [CLI Models](/cli/models).

### 9) Talk (speech)

Mode talk dapat memanggil **ElevenLabs** saat dikonfigurasi:

- `ELEVENLABS_API_KEY` atau `talk.providers.elevenlabs.apiKey`

Lihat [Mode talk](/id/nodes/talk).

### 10) Skills (API pihak ketiga)

Skills dapat menyimpan `apiKey` di `skills.entries.<name>.apiKey`. Jika suatu skill menggunakan kunci tersebut untuk
API eksternal, hal itu dapat menimbulkan biaya sesuai provider skill tersebut.

Lihat [Skills](/id/tools/skills).
