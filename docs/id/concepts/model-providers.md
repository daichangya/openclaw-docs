---
read_when:
    - Anda memerlukan referensi pengaturan model per provider
    - Anda menginginkan contoh config atau perintah onboarding CLI untuk provider model
summary: Ikhtisar provider model dengan contoh config + alur CLI
title: Provider model
x-i18n:
    generated_at: "2026-04-25T13:44:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe2871809711608b3e1d996084b834978b15f21dfeea1ac767dce4c1299be0aa
    source_path: concepts/model-providers.md
    workflow: 15
---

Referensi untuk **provider LLM/model** (bukan saluran chat seperti WhatsApp/Telegram). Untuk aturan pemilihan model, lihat [Models](/id/concepts/models).

## Aturan cepat

- Referensi model menggunakan `provider/model` (contoh: `opencode/claude-opus-4-6`).
- `agents.defaults.models` bertindak sebagai allowlist jika diatur.
- Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` adalah metadata model native; `contextTokens` adalah batas runtime efektif.
- Aturan fallback, probe cooldown, dan persistensi override sesi: [Model failover](/id/concepts/model-failover).
- Rute keluarga OpenAI bersifat spesifik prefiks: `openai/<model>` menggunakan provider API key OpenAI langsung di Pi, `openai-codex/<model>` menggunakan OAuth Codex di Pi, dan `openai/<model>` plus `agents.defaults.embeddedHarness.runtime: "codex"` menggunakan harness server aplikasi Codex native. Lihat [OpenAI](/id/providers/openai) dan [Codex harness](/id/plugins/codex-harness). Jika pemisahan provider/runtime membingungkan, baca [Agent runtimes](/id/concepts/agent-runtimes) terlebih dahulu.
- Auto-enable Plugin mengikuti batas yang sama: `openai-codex/<model>` milik Plugin OpenAI, sedangkan Plugin Codex diaktifkan oleh `embeddedHarness.runtime: "codex"` atau referensi lama `codex/<model>`.
- Runtime CLI menggunakan pemisahan yang sama: pilih referensi model kanonis seperti `anthropic/claude-*`, `google/gemini-*`, atau `openai/gpt-*`, lalu atur `agents.defaults.embeddedHarness.runtime` ke `claude-cli`, `google-gemini-cli`, atau `codex-cli` saat Anda menginginkan backend CLI lokal. Referensi lama `claude-cli/*`, `google-gemini-cli/*`, dan `codex-cli/*` dimigrasikan kembali ke referensi provider kanonis dengan runtime dicatat secara terpisah.
- GPT-5.5 tersedia melalui `openai-codex/gpt-5.5` di Pi, harness server aplikasi Codex native, dan API OpenAI publik saat katalog Pi bawaan mengekspos `openai/gpt-5.5` untuk instalasi Anda.

## Perilaku provider yang dimiliki Plugin

Sebagian besar logika spesifik provider berada di Plugin provider (`registerProvider(...)`) sementara OpenClaw menjaga loop inferensi generik. Plugin memiliki onboarding, katalog model, pemetaan auth env-var, normalisasi transport/config, pembersihan skema tool, klasifikasi failover, refresh OAuth, pelaporan penggunaan, profil thinking/reasoning, dan lainnya.

Daftar lengkap hook provider-SDK dan contoh Plugin bawaan ada di [Provider plugins](/id/plugins/sdk-provider-plugins). Provider yang membutuhkan eksekutor permintaan kustom sepenuhnya adalah permukaan ekstensi yang terpisah dan lebih dalam.

<Note>
`capabilities` runtime provider adalah metadata runner bersama (keluarga provider, keanehan transkrip/tooling, petunjuk transport/cache). Ini tidak sama dengan [public capability model](/id/plugins/architecture#public-capability-model), yang menjelaskan apa yang didaftarkan Plugin (inferensi teks, ucapan, dll.).
</Note>

## Rotasi API key

- Mendukung rotasi provider generik untuk provider tertentu.
- Konfigurasikan beberapa key melalui:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (satu override live, prioritas tertinggi)
  - `<PROVIDER>_API_KEYS` (daftar dipisahkan koma atau titik koma)
  - `<PROVIDER>_API_KEY` (key utama)
  - `<PROVIDER>_API_KEY_*` (daftar bernomor, misalnya `<PROVIDER>_API_KEY_1`)
- Untuk provider Google, `GOOGLE_API_KEY` juga disertakan sebagai fallback.
- Urutan pemilihan key mempertahankan prioritas dan menghapus duplikasi nilai.
- Permintaan dicoba ulang dengan key berikutnya hanya pada respons rate-limit (misalnya `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, atau pesan batas penggunaan periodik).
- Kegagalan non-rate-limit langsung gagal; tidak ada rotasi key yang dicoba.
- Saat semua key kandidat gagal, error akhir dikembalikan dari percobaan terakhir.

## Provider bawaan (katalog pi-ai)

OpenClaw dikirim dengan katalog pi‑ai. Provider ini **tidak** memerlukan config `models.providers`; cukup atur auth + pilih model.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotasi opsional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (satu override)
- Contoh model: `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Dukungan API langsung GPT-5.5 bergantung pada versi katalog PI bawaan untuk instalasi Anda; verifikasi dengan `openclaw models list --provider openai` sebelum menggunakan `openai/gpt-5.5` tanpa runtime server aplikasi Codex.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport default adalah `auto` (WebSocket terlebih dahulu, fallback SSE)
- Override per model melalui `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- Warm-up WebSocket OpenAI Responses default-nya aktif melalui `params.openaiWsWarmup` (`true`/`false`)
- Pemrosesan prioritas OpenAI dapat diaktifkan melalui `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` dan `params.fastMode` memetakan permintaan Responses `openai/*` langsung ke `service_tier=priority` di `api.openai.com`
- Gunakan `params.serviceTier` saat Anda menginginkan tier eksplisit alih-alih toggle `/fast` bersama
- Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) hanya berlaku pada lalu lintas OpenAI native ke `api.openai.com`, bukan proxy generik yang kompatibel dengan OpenAI
- Rute OpenAI native juga mempertahankan Responses `store`, petunjuk prompt-cache, dan pembentukan payload kompatibilitas reasoning OpenAI; rute proxy tidak
- `openai/gpt-5.3-codex-spark` sengaja disembunyikan di OpenClaw karena permintaan API OpenAI live menolaknya dan katalog Codex saat ini tidak mengeksposnya

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotasi opsional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (satu override)
- Contoh model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Permintaan Anthropic publik langsung mendukung toggle `/fast` bersama dan `params.fastMode`, termasuk lalu lintas yang diautentikasi dengan API key dan OAuth yang dikirim ke `api.anthropic.com`; OpenClaw memetakannya ke Anthropic `service_tier` (`auto` vs `standard_only`)
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI ala OpenClaw diizinkan lagi, jadi OpenClaw memperlakukan reuse Claude CLI dan penggunaan `claude -p` sebagai diizinkan untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Setup-token Anthropic tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih reuse Claude CLI dan `claude -p` saat tersedia.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI Codex

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Referensi model PI: `openai-codex/gpt-5.5`
- Referensi harness server aplikasi Codex native: `openai/gpt-5.5` dengan `agents.defaults.embeddedHarness.runtime: "codex"`
- Dokumen harness server aplikasi Codex native: [Codex harness](/id/plugins/codex-harness)
- Referensi model lama: `codex/gpt-*`
- Batas Plugin: `openai-codex/*` memuat Plugin OpenAI; Plugin server aplikasi Codex native dipilih hanya oleh runtime Codex harness atau referensi lama `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` atau `openclaw models auth login --provider openai-codex`
- Transport default adalah `auto` (WebSocket terlebih dahulu, fallback SSE)
- Override per model PI melalui `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- `params.serviceTier` juga diteruskan pada permintaan Responses Codex native (`chatgpt.com/backend-api`)
- Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) hanya dilampirkan pada lalu lintas Codex native ke `chatgpt.com/backend-api`, bukan proxy generik yang kompatibel dengan OpenAI
- Berbagi toggle `/fast` dan config `params.fastMode` yang sama seperti `openai/*` langsung; OpenClaw memetakannya ke `service_tier=priority`
- `openai-codex/gpt-5.5` menggunakan `contextWindow = 400000` native katalog Codex dan runtime default `contextTokens = 272000`; override batas runtime dengan `models.providers.openai-codex.models[].contextTokens`
- Catatan kebijakan: OAuth OpenAI Codex secara eksplisit didukung untuk tool/alur kerja eksternal seperti OpenClaw.
- Gunakan `openai-codex/gpt-5.5` saat Anda menginginkan rute OAuth/langganan Codex; gunakan `openai/gpt-5.5` saat pengaturan API key dan katalog lokal Anda mengekspos rute API publik.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Opsi host bergaya langganan lainnya

- [Qwen Cloud](/id/providers/qwen): permukaan provider Qwen Cloud plus pemetaan endpoint Alibaba DashScope dan Coding Plan
- [MiniMax](/id/providers/minimax): akses OAuth atau API key MiniMax Coding Plan
- [GLM models](/id/providers/glm): endpoint Z.AI Coding Plan atau API umum

### OpenCode

- Auth: `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`)
- Provider runtime Zen: `opencode`
- Provider runtime Go: `opencode-go`
- Contoh model: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` atau `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Rotasi opsional: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY`, dan `OPENCLAW_LIVE_GEMINI_KEY` (satu override)
- Contoh model: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilitas: config OpenClaw lama yang menggunakan `google/gemini-3.1-flash-preview` dinormalisasi ke `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` menggunakan dynamic thinking Google. Gemini 3/3.1 menghilangkan `thinkingLevel` tetap; Gemini 2.5 mengirim `thinkingBudget: -1`.
- Eksekusi Gemini langsung juga menerima `agents.defaults.models["google/<model>"].params.cachedContent` (atau `cached_content` lama) untuk meneruskan handle `cachedContents/...` native provider; cache hit Gemini muncul sebagai OpenClaw `cacheRead`

### Google Vertex dan Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex menggunakan gcloud ADC; Gemini CLI menggunakan alur OAuth-nya
- Peringatan: OAuth Gemini CLI di OpenClaw adalah integrasi tidak resmi. Beberapa pengguna melaporkan pembatasan akun Google setelah menggunakan klien pihak ketiga. Tinjau ketentuan Google dan gunakan akun non-kritis jika Anda memilih melanjutkan.
- OAuth Gemini CLI dikirim sebagai bagian dari Plugin `google` bawaan.
  - Instal Gemini CLI terlebih dahulu:
    - `brew install gemini-cli`
    - atau `npm install -g @google/gemini-cli`
  - Aktifkan: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Model default: `google-gemini-cli/gemini-3-flash-preview`
  - Catatan: Anda **tidak** menempelkan client id atau secret ke `openclaw.json`. Alur login CLI menyimpan token di profil auth pada host gateway.
  - Jika permintaan gagal setelah login, atur `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host gateway.
  - Balasan JSON Gemini CLI di-parse dari `response`; penggunaan fallback ke `stats`, dengan `stats.cached` dinormalisasi menjadi OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Contoh model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` dan `z-ai/*` dinormalisasi ke `zai/*`
  - `zai-api-key` mendeteksi otomatis endpoint Z.AI yang cocok; `zai-coding-global`, `zai-coding-cn`, `zai-global`, dan `zai-cn` memaksa permukaan tertentu

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Contoh model: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Contoh model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Katalog fallback statis mengirim `kilocode/kilo/auto`; penemuan live
  `https://api.kilo.ai/api/gateway/models` dapat memperluas katalog runtime
  lebih lanjut.
- Perutean upstream yang tepat di balik `kilocode/kilo/auto` dimiliki oleh Kilo Gateway,
  bukan di-hard-code di OpenClaw.

Lihat [/providers/kilocode](/id/providers/kilocode) untuk detail pengaturan.

### Plugin provider bawaan lainnya

| Provider                | Id                               | Auth env                                                     | Contoh model                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

Hal-hal khusus yang perlu diketahui:

- **OpenRouter** menerapkan header atribusi aplikasi dan penanda Anthropic `cache_control` hanya pada rute `openrouter.ai` yang terverifikasi. Referensi DeepSeek, Moonshot, dan ZAI memenuhi syarat cache-TTL untuk prompt caching yang dikelola OpenRouter tetapi tidak menerima penanda cache Anthropic. Sebagai jalur bergaya proxy yang kompatibel dengan OpenAI, ini melewati pembentukan khusus OpenAI native (`serviceTier`, Responses `store`, petunjuk prompt-cache, kompatibilitas reasoning OpenAI). Referensi berbasis Gemini tetap mempertahankan sanitasi thought-signature proxy-Gemini saja.
- **Kilo Gateway** referensi berbasis Gemini mengikuti jalur sanitasi proxy-Gemini yang sama; `kilocode/kilo/auto` dan referensi lain yang tidak mendukung proxy-reasoning melewati injeksi reasoning proxy.
- **MiniMax** onboarding API key menulis definisi model chat M2.7 khusus teks secara eksplisit; pemahaman gambar tetap berada pada provider media `MiniMax-VL-01` yang dimiliki Plugin.
- **xAI** menggunakan jalur xAI Responses. `/fast` atau `params.fastMode: true` menulis ulang `grok-3`, `grok-3-mini`, `grok-4`, dan `grok-4-0709` ke varian `*-fast` mereka. `tool_stream` aktif secara default; nonaktifkan melalui `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** model GLM menggunakan `zai-glm-4.7` / `zai-glm-4.6`; base URL yang kompatibel dengan OpenAI adalah `https://api.cerebras.ai/v1`.

## Provider melalui `models.providers` (kustom/base URL)

Gunakan `models.providers` (atau `models.json`) untuk menambahkan **provider** kustom atau proxy yang kompatibel dengan OpenAI/Anthropic.

Banyak Plugin provider bawaan di bawah ini sudah menerbitkan katalog default.
Gunakan entri `models.providers.<id>` yang eksplisit hanya saat Anda ingin menimpa
base URL, header, atau daftar model default.

### Moonshot AI (Kimi)

Moonshot dikirim sebagai Plugin provider bawaan. Gunakan provider bawaan secara
default, dan tambahkan entri `models.providers.moonshot` yang eksplisit hanya saat Anda
perlu menimpa base URL atau metadata model:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Contoh model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` atau `openclaw onboard --auth-choice moonshot-api-key-cn`

ID model Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding menggunakan endpoint Moonshot AI yang kompatibel dengan Anthropic:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- Contoh model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

`kimi/k2p5` lama tetap diterima sebagai id model kompatibilitas.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) menyediakan akses ke Doubao dan model lain di China.

- Provider: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Contoh model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding secara default menggunakan permukaan coding, tetapi katalog umum `volcengine/*`
didaftarkan pada saat yang sama.

Dalam pemilih model onboarding/configure, pilihan auth Volcengine mengutamakan kedua
baris `volcengine/*` dan `volcengine-plan/*`. Jika model-model tersebut belum dimuat,
OpenClaw fallback ke katalog yang tidak difilter alih-alih menampilkan pemilih
bercakupan provider yang kosong.

Model yang tersedia:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Model coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (Internasional)

BytePlus ARK menyediakan akses ke model yang sama seperti Volcano Engine untuk pengguna internasional.

- Provider: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Contoh model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding secara default menggunakan permukaan coding, tetapi katalog umum `byteplus/*`
didaftarkan pada saat yang sama.

Dalam pemilih model onboarding/configure, pilihan auth BytePlus mengutamakan kedua
baris `byteplus/*` dan `byteplus-plan/*`. Jika model-model tersebut belum dimuat,
OpenClaw fallback ke katalog yang tidak difilter alih-alih menampilkan pemilih
bercakupan provider yang kosong.

Model yang tersedia:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Model coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic menyediakan model yang kompatibel dengan Anthropic di balik provider `synthetic`:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Contoh model: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax dikonfigurasi melalui `models.providers` karena menggunakan endpoint kustom:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` untuk `minimax`; `MINIMAX_OAUTH_TOKEN` atau
  `MINIMAX_API_KEY` untuk `minimax-portal`

Lihat [/providers/minimax](/id/providers/minimax) untuk detail pengaturan, opsi model, dan potongan config.

Pada jalur streaming MiniMax yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking secara default kecuali Anda mengaturnya secara eksplisit, dan `/fast on` menulis ulang `MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.

Pemisahan capability yang dimiliki Plugin:

- Default teks/chat tetap pada `minimax/MiniMax-M2.7`
- Pembuatan gambar adalah `minimax/image-01` atau `minimax-portal/image-01`
- Pemahaman gambar adalah `MiniMax-VL-01` yang dimiliki Plugin pada kedua jalur auth MiniMax
- Pencarian web tetap pada id provider `minimax`

### LM Studio

LM Studio dikirim sebagai Plugin provider bawaan yang menggunakan API native:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- Base URL inferensi default: `http://localhost:1234/v1`

Lalu atur model (ganti dengan salah satu ID yang dikembalikan oleh `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw menggunakan `/api/v1/models` dan `/api/v1/models/load` native LM Studio
untuk discovery + auto-load, dengan `/v1/chat/completions` untuk inferensi secara default.
Lihat [/providers/lmstudio](/id/providers/lmstudio) untuk pengaturan dan pemecahan masalah.

### Ollama

Ollama dikirim sebagai Plugin provider bawaan dan menggunakan API native Ollama:

- Provider: `ollama`
- Auth: Tidak diperlukan (server lokal)
- Contoh model: `ollama/llama3.3`
- Instalasi: [https://ollama.com/download](https://ollama.com/download)

```bash
# Instal Ollama, lalu pull model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama dideteksi secara lokal di `http://127.0.0.1:11434` saat Anda ikut serta dengan
`OLLAMA_API_KEY`, dan Plugin provider bawaan menambahkan Ollama langsung ke
`openclaw onboard` dan pemilih model. Lihat [/providers/ollama](/id/providers/ollama)
untuk onboarding, mode cloud/lokal, dan konfigurasi kustom.

### vLLM

vLLM dikirim sebagai Plugin provider bawaan untuk server lokal/self-hosted yang kompatibel dengan OpenAI:

- Provider: `vllm`
- Auth: Opsional (bergantung pada server Anda)
- Base URL default: `http://127.0.0.1:8000/v1`

Untuk ikut serta dalam auto-discovery secara lokal (nilai apa pun dapat digunakan jika server Anda tidak memaksakan auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Lalu atur model (ganti dengan salah satu ID yang dikembalikan oleh `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Lihat [/providers/vllm](/id/providers/vllm) untuk detail.

### SGLang

SGLang dikirim sebagai Plugin provider bawaan untuk server self-hosted cepat yang kompatibel dengan OpenAI:

- Provider: `sglang`
- Auth: Opsional (bergantung pada server Anda)
- Base URL default: `http://127.0.0.1:30000/v1`

Untuk ikut serta dalam auto-discovery secara lokal (nilai apa pun dapat digunakan jika server Anda tidak memaksakan auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Lalu atur model (ganti dengan salah satu ID yang dikembalikan oleh `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Lihat [/providers/sglang](/id/providers/sglang) untuk detail.

### Proxy lokal (LM Studio, vLLM, LiteLLM, dll.)

Contoh (kompatibel dengan OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Model Lokal",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Catatan:

- Untuk provider kustom, `reasoning`, `input`, `cost`, `contextWindow`, dan `maxTokens` bersifat opsional.
  Jika dihilangkan, OpenClaw default ke:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Disarankan: atur nilai eksplisit yang cocok dengan batas proxy/model Anda.
- Untuk `api: "openai-completions"` pada endpoint non-native (setiap `baseUrl` non-kosong yang host-nya bukan `api.openai.com`), OpenClaw memaksa `compat.supportsDeveloperRole: false` untuk menghindari error provider 400 untuk role `developer` yang tidak didukung.
- Rute bergaya proxy yang kompatibel dengan OpenAI juga melewati pembentukan permintaan yang hanya khusus OpenAI native: tidak ada `service_tier`, tidak ada Responses `store`, tidak ada Completions `store`, tidak ada petunjuk prompt-cache, tidak ada pembentukan payload kompatibilitas reasoning OpenAI, dan tidak ada header atribusi OpenClaw tersembunyi.
- Untuk proxy Completions yang kompatibel dengan OpenAI dan membutuhkan field khusus vendor, atur `agents.defaults.models["provider/model"].params.extra_body` (atau `extraBody`) untuk menggabungkan JSON tambahan ke body permintaan keluar.
- Jika `baseUrl` kosong/tidak diisi, OpenClaw mempertahankan perilaku OpenAI default (yang me-resolve ke `api.openai.com`).
- Demi keamanan, `compat.supportsDeveloperRole: true` yang eksplisit tetap ditimpa pada endpoint `openai-completions` non-native.

## Contoh CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Lihat juga: [Configuration](/id/gateway/configuration) untuk contoh konfigurasi lengkap.

## Terkait

- [Models](/id/concepts/models) — konfigurasi model dan alias
- [Model failover](/id/concepts/model-failover) — rantai fallback dan perilaku percobaan ulang
- [Referensi konfigurasi](/id/gateway/config-agents#agent-defaults) — kunci config model
- [Providers](/id/providers) — panduan pengaturan per provider
