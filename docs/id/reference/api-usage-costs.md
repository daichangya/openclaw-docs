---
read_when:
    - Anda ingin memahami fitur mana yang mungkin memanggil API berbayar
    - Anda perlu mengaudit kunci, biaya, dan visibilitas penggunaan
    - Anda sedang menjelaskan pelaporan biaya `/status` atau `/usage`
summary: Audit apa yang dapat menghabiskan uang, kunci mana yang digunakan, dan cara melihat penggunaan
title: Penggunaan dan biaya API
x-i18n:
    generated_at: "2026-04-25T13:55:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2958c0961b46961d942a5bb6e7954eda6bf3d0f659ae0bffb390a8502e00ff38
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Penggunaan & biaya API

Dokumen ini mencantumkan **fitur yang dapat memanggil API key** dan tempat biayanya muncul. Fokusnya adalah pada
fitur OpenClaw yang dapat menghasilkan penggunaan provider atau panggilan API berbayar.

## Tempat biaya muncul (chat + CLI)

**Snapshot biaya per sesi**

- `/status` menampilkan model sesi saat ini, penggunaan konteks, dan token respons terakhir.
- Jika model menggunakan **auth API key**, `/status` juga menampilkan **perkiraan biaya** untuk balasan terakhir.
- Jika metadata sesi langsung minim, `/status` dapat memulihkan penghitung
  token/cache dan label model runtime aktif dari entri penggunaan transkrip
  terbaru. Nilai langsung yang sudah ada dan bukan nol tetap diprioritaskan, dan total
  transkrip berukuran prompt dapat menang saat total tersimpan tidak ada atau lebih kecil.

**Footer biaya per pesan**

- `/usage full` menambahkan footer penggunaan ke setiap balasan, termasuk **perkiraan biaya** (khusus API key).
- `/usage tokens` hanya menampilkan token; alur OAuth/token bergaya langganan dan CLI menyembunyikan biaya dalam dolar.
- Catatan Gemini CLI: saat CLI mengembalikan output JSON, OpenClaw membaca penggunaan dari
  `stats`, menormalkan `stats.cached` menjadi `cacheRead`, dan menurunkan token input
  dari `stats.input_tokens - stats.cached` bila diperlukan.

Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw
diizinkan lagi, sehingga OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai
sesuatu yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
Anthropic masih tidak mengekspos perkiraan dolar per pesan yang dapat ditampilkan OpenClaw
di `/usage full`.

**Jendela penggunaan CLI (kuota provider)**

- `openclaw status --usage` dan `openclaw channels list` menampilkan **jendela penggunaan**
  provider (snapshot kuota, bukan biaya per pesan).
- Output untuk manusia dinormalisasi menjadi `X% left` di semua provider.
- Provider jendela penggunaan saat ini: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, dan z.ai.
- Catatan MiniMax: field mentah `usage_percent` / `usagePercent` berarti
  kuota yang tersisa, sehingga OpenClaw membalik nilainya sebelum ditampilkan. Field berbasis jumlah tetap diutamakan
  bila ada. Jika provider mengembalikan `model_remains`, OpenClaw memprioritaskan entri model chat,
  menurunkan label jendela dari stempel waktu bila diperlukan, dan
  menyertakan nama model dalam label paket.
- Auth penggunaan untuk jendela kuota tersebut berasal dari hook khusus provider bila
  tersedia; jika tidak, OpenClaw menggunakan fallback dengan mencocokkan kredensial OAuth/API key
  dari profil auth, env, atau config.

Lihat [Penggunaan & biaya token](/id/reference/token-use) untuk detail dan contoh.

## Cara kunci ditemukan

OpenClaw dapat mengambil kredensial dari:

- **Profil auth** (per-agent, disimpan di `auth-profiles.json`).
- **Variabel environment** (mis. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
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

Lihat [Model](/id/providers/models) untuk config harga dan [Penggunaan & biaya token](/id/reference/token-use) untuk tampilan.

### 2) Pemahaman media (audio/gambar/video)

Media masuk dapat diringkas/ditranskripsikan sebelum balasan dijalankan. Ini menggunakan API model/provider.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Gambar: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Lihat [Pemahaman media](/id/nodes/media-understanding).

### 3) Pembuatan gambar dan video

Kapabilitas generasi bersama juga dapat menghabiskan kunci provider:

- Pembuatan gambar: OpenAI / Google / fal / MiniMax
- Pembuatan video: Qwen

Pembuatan gambar dapat menyimpulkan default provider berbasis auth ketika
`agents.defaults.imageGenerationModel` tidak diatur. Pembuatan video saat ini
memerlukan `agents.defaults.videoGenerationModel` eksplisit seperti
`qwen/wan2.6-t2v`.

Lihat [Pembuatan gambar](/id/tools/image-generation), [Qwen Cloud](/id/providers/qwen),
dan [Model](/id/concepts/models).

### 4) Embedding memori + pencarian semantik

Pencarian memori semantik menggunakan **API embedding** saat dikonfigurasi untuk provider jarak jauh:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "lmstudio"` → embedding LM Studio (lokal/self-hosted)
- `memorySearch.provider = "ollama"` → embedding Ollama (lokal/self-hosted; biasanya tanpa tagihan API terhosting)
- Fallback opsional ke provider jarak jauh jika embedding lokal gagal

Anda dapat tetap lokal dengan `memorySearch.provider = "local"` (tanpa penggunaan API).

Lihat [Memori](/id/concepts/memory).

### 5) Tool pencarian web

`web_search` dapat menimbulkan biaya penggunaan tergantung pada provider Anda:

- **Brave Search API**: `BRAVE_API_KEY` atau `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` atau `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` atau `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` atau `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, atau `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, atau `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: bebas kunci secara default, tetapi memerlukan host Ollama yang dapat dijangkau ditambah `ollama signin`; juga dapat menggunakan ulang auth bearer provider Ollama normal saat host memerlukannya
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, atau `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` atau `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback bebas kunci (tanpa tagihan API, tetapi tidak resmi dan berbasis HTML)
- **SearXNG**: `SEARXNG_BASE_URL` atau `plugins.entries.searxng.config.webSearch.baseUrl` (bebas kunci/self-hosted; tanpa tagihan API terhosting)

Path provider `tools.web.search.*` lama masih dimuat melalui shim kompatibilitas sementara, tetapi itu bukan lagi permukaan config yang direkomendasikan.

**Kredit gratis Brave Search:** Setiap paket Brave menyertakan kredit gratis yang
diperbarui sebesar \$5/bulan. Paket Search berbiaya \$5 per 1.000 permintaan, jadi kredit tersebut mencakup
1.000 permintaan/bulan tanpa biaya. Atur batas penggunaan Anda di dashboard Brave
untuk menghindari biaya tak terduga.

Lihat [Tool web](/id/tools/web).

### 5) Tool web fetch (Firecrawl)

`web_fetch` dapat memanggil **Firecrawl** saat API key tersedia:

- `FIRECRAWL_API_KEY` atau `plugins.entries.firecrawl.config.webFetch.apiKey`

Jika Firecrawl tidak dikonfigurasi, tool akan menggunakan fallback ke fetch langsung ditambah plugin `web-readability` bawaan (tanpa API berbayar). Nonaktifkan `plugins.entries.web-readability.enabled` untuk melewati ekstraksi Readability lokal.

Lihat [Tool web](/id/tools/web).

### 6) Snapshot penggunaan provider (status/health)

Beberapa perintah status memanggil **endpoint penggunaan provider** untuk menampilkan jendela kuota atau health auth.
Biasanya ini adalah panggilan bervolume rendah tetapi tetap mengenai API provider:

- `openclaw status --usage`
- `openclaw models status --json`

Lihat [Models CLI](/id/cli/models).

### 7) Perangkuman pengaman Compaction

Pengaman Compaction dapat merangkum riwayat sesi menggunakan **model saat ini**, yang
memanggil API provider saat dijalankan.

Lihat [Manajemen sesi + Compaction](/id/reference/session-management-compaction).

### 8) Pemindaian / probe model

`openclaw models scan` dapat melakukan probe pada model OpenRouter dan menggunakan `OPENROUTER_API_KEY` saat
probing diaktifkan.

Lihat [Models CLI](/id/cli/models).

### 9) Talk (speech)

Mode Talk dapat memanggil **ElevenLabs** saat dikonfigurasi:

- `ELEVENLABS_API_KEY` atau `talk.providers.elevenlabs.apiKey`

Lihat [Mode Talk](/id/nodes/talk).

### 10) Skills (API pihak ketiga)

Skills dapat menyimpan `apiKey` di `skills.entries.<name>.apiKey`. Jika sebuah skill menggunakan kunci itu untuk API eksternal
, skill tersebut dapat menimbulkan biaya sesuai provider skill itu.

Lihat [Skills](/id/tools/skills).

## Terkait

- [Penggunaan dan biaya token](/id/reference/token-use)
- [Caching prompt](/id/reference/prompt-caching)
- [Pelacakan penggunaan](/id/concepts/usage-tracking)
