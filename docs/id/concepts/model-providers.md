---
read_when:
    - Anda memerlukan referensi penyiapan model per provider
    - Anda menginginkan contoh konfigurasi atau perintah onboarding CLI untuk provider model
summary: Ikhtisar provider model dengan contoh konfigurasi + alur CLI
title: Provider model
x-i18n:
    generated_at: "2026-04-21T09:17:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6732ab672757579c09395583a0f7d110348c909d4e4ab1d2accad68ad054c636
    source_path: concepts/model-providers.md
    workflow: 15
---

# Provider model

Halaman ini membahas **provider LLM/model** (bukan channel obrolan seperti WhatsApp/Telegram).
Untuk aturan pemilihan model, lihat [/concepts/models](/id/concepts/models).

## Aturan cepat

- Referensi model menggunakan `provider/model` (contoh: `opencode/claude-opus-4-6`).
- Jika Anda menetapkan `agents.defaults.models`, itu menjadi allowlist.
- Helper CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Aturan runtime fallback, probe cooldown, dan persistensi override sesi
  didokumentasikan di [/concepts/model-failover](/id/concepts/model-failover).
- `models.providers.*.models[].contextWindow` adalah metadata model native;
  `models.providers.*.models[].contextTokens` adalah batas runtime efektif.
- Plugin provider dapat menyuntikkan katalog model melalui `registerProvider({ catalog })`;
  OpenClaw menggabungkan output itu ke dalam `models.providers` sebelum menulis
  `models.json`.
- Manifes provider dapat mendeklarasikan `providerAuthEnvVars` dan
  `providerAuthAliases` sehingga probe auth generik berbasis env dan varian provider
  tidak perlu memuat runtime plugin. Peta env-var inti yang tersisa sekarang
  hanya untuk provider non-plugin/inti dan beberapa kasus prioritas generik
  seperti onboarding Anthropic yang mengutamakan API key.
- Plugin provider juga dapat memiliki perilaku runtime provider melalui
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile`, `isBinaryThinking`,
  `supportsXHighThinking`, `resolveDefaultThinkingLevel`,
  `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, dan
  `onModelSelected`.
- Catatan: runtime provider `capabilities` adalah metadata runner bersama (keluarga provider,
  kekhasan transkrip/tooling, petunjuk transport/cache). Ini tidak sama
  dengan [model capability publik](/id/plugins/architecture#public-capability-model)
  yang menjelaskan apa yang didaftarkan sebuah plugin (inferensi teks, speech, dll.).
- Provider `codex` bawaan dipasangkan dengan harness agen Codex bawaan.
  Gunakan `codex/gpt-*` saat Anda menginginkan login milik Codex, penemuan model,
  pelanjutan thread native, dan eksekusi app-server. Referensi `openai/gpt-*`
  biasa tetap menggunakan provider OpenAI dan transport provider OpenClaw normal.
  Deployment khusus Codex dapat menonaktifkan fallback PI otomatis dengan
  `agents.defaults.embeddedHarness.fallback: "none"`; lihat
  [Codex Harness](/id/plugins/codex-harness).

## Perilaku provider yang dimiliki Plugin

Plugin provider kini dapat memiliki sebagian besar logika khusus provider sementara OpenClaw mempertahankan
loop inferensi generik.

Pembagian yang umum:

- `auth[].run` / `auth[].runNonInteractive`: provider memiliki alur onboarding/login
  untuk `openclaw onboard`, `openclaw models auth`, dan penyiapan headless
- `wizard.setup` / `wizard.modelPicker`: provider memiliki label pilihan auth,
  alias lama, petunjuk allowlist onboarding, dan entri penyiapan di pemilih onboarding/model
- `catalog`: provider muncul di `models.providers`
- `normalizeModelId`: provider menormalkan id model lama/preview sebelum
  lookup atau kanonikalisasi
- `normalizeTransport`: provider menormalkan `api` / `baseUrl` keluarga transport
  sebelum perakitan model generik; OpenClaw memeriksa provider yang cocok terlebih dahulu,
  lalu plugin provider lain yang mampu hook sampai salah satunya benar-benar mengubah
  transport
- `normalizeConfig`: provider menormalkan konfigurasi `models.providers.<id>` sebelum
  runtime menggunakannya; OpenClaw memeriksa provider yang cocok terlebih dahulu, lalu plugin provider
  lain yang mampu hook sampai salah satunya benar-benar mengubah konfigurasi. Jika tidak ada
  hook provider yang menulis ulang konfigurasi, helper keluarga Google bawaan tetap
  menormalkan entri provider Google yang didukung.
- `applyNativeStreamingUsageCompat`: provider menerapkan penulisan ulang kompatibilitas streaming-usage native berbasis endpoint untuk provider konfigurasi
- `resolveConfigApiKey`: provider me-resolve auth penanda env untuk provider konfigurasi
  tanpa memaksa pemuatan auth runtime penuh. `amazon-bedrock` juga memiliki
  resolver penanda env AWS bawaan di sini, walaupun auth runtime Bedrock menggunakan
  rantai default AWS SDK.
- `resolveSyntheticAuth`: provider dapat mengekspos ketersediaan auth lokal/self-hosted atau auth berbasis konfigurasi lain
  tanpa menyimpan rahasia plaintext
- `shouldDeferSyntheticProfileAuth`: provider dapat menandai placeholder profil sintetis yang disimpan
  sebagai prioritas lebih rendah daripada auth berbasis env/config
- `resolveDynamicModel`: provider menerima id model yang belum ada di katalog statis lokal
- `prepareDynamicModel`: provider memerlukan penyegaran metadata sebelum mencoba ulang
  resolusi dinamis
- `normalizeResolvedModel`: provider memerlukan penulisan ulang transport atau base URL
- `contributeResolvedModelCompat`: provider menyumbang flag kompatibilitas untuk
  model vendor miliknya bahkan saat model itu datang melalui transport kompatibel lain
- `capabilities`: provider menerbitkan kekhasan transkrip/tooling/keluarga-provider
- `normalizeToolSchemas`: provider membersihkan skema tool sebelum
  runner tertanam melihatnya
- `inspectToolSchemas`: provider menampilkan peringatan skema khusus transport
  setelah normalisasi
- `resolveReasoningOutputMode`: provider memilih kontrak output reasoning native vs bertag
- `prepareExtraParams`: provider menetapkan default atau menormalkan parameter request per model
- `createStreamFn`: provider mengganti jalur stream normal dengan transport
  kustom sepenuhnya
- `wrapStreamFn`: provider menerapkan wrapper kompatibilitas request header/body/model
- `resolveTransportTurnState`: provider menyediakan header atau metadata transport native per giliran
- `resolveWebSocketSessionPolicy`: provider menyediakan header sesi WebSocket native
  atau kebijakan cooldown sesi
- `createEmbeddingProvider`: provider memiliki perilaku embedding memori saat
  itu lebih tepat berada pada plugin provider daripada switchboard embedding inti
- `formatApiKey`: provider memformat profil auth yang disimpan ke dalam string
  runtime `apiKey` yang diharapkan oleh transport
- `refreshOAuth`: provider memiliki refresh OAuth ketika refresher bersama `pi-ai`
  tidak mencukupi
- `buildAuthDoctorHint`: provider menambahkan panduan perbaikan ketika refresh OAuth
  gagal
- `matchesContextOverflowError`: provider mengenali error overflow context-window
  khusus provider yang akan terlewat oleh heuristik generik
- `classifyFailoverReason`: provider memetakan error mentah transport/API khusus provider
  ke alasan failover seperti rate limit atau overload
- `isCacheTtlEligible`: provider memutuskan id model upstream mana yang mendukung prompt-cache TTL
- `buildMissingAuthMessage`: provider mengganti error auth-store generik
  dengan petunjuk pemulihan khusus provider
- `suppressBuiltInModel`: provider menyembunyikan baris upstream yang usang dan dapat mengembalikan
  error milik vendor untuk kegagalan resolusi langsung
- `augmentModelCatalog`: provider menambahkan baris katalog sintetis/final setelah
  discovery dan penggabungan konfigurasi
- `resolveThinkingProfile`: provider memiliki set level `/think` yang tepat,
  label tampilan opsional, dan level default untuk model terpilih
- `isBinaryThinking`: hook kompatibilitas untuk UX thinking biner nyala/mati
- `supportsXHighThinking`: hook kompatibilitas untuk model `xhigh` yang dipilih
- `resolveDefaultThinkingLevel`: hook kompatibilitas untuk kebijakan `/think` default
- `applyConfigDefaults`: provider menerapkan default global khusus provider
  selama materialisasi konfigurasi berdasarkan mode auth, env, atau keluarga model
- `isModernModelRef`: provider memiliki pencocokan model pilihan live/smoke
- `prepareRuntimeAuth`: provider mengubah kredensial yang dikonfigurasi menjadi token runtime
  berumur pendek
- `resolveUsageAuth`: provider me-resolve kredensial usage/quota untuk `/usage`
  dan permukaan status/pelaporan terkait
- `fetchUsageSnapshot`: provider memiliki pengambilan/parsing endpoint usage sementara
  inti tetap memiliki shell ringkasan dan pemformatan
- `onModelSelected`: provider menjalankan efek samping pascapemilihan seperti
  telemetri atau pencatatan sesi milik provider

Contoh bawaan saat ini:

- `anthropic`: fallback kompatibilitas-maju Claude 4.6, petunjuk perbaikan auth, pengambilan endpoint
  usage, metadata cache-TTL/keluarga-provider, dan default konfigurasi global
  yang sadar-auth
- `amazon-bedrock`: pencocokan context-overflow yang dimiliki provider dan klasifikasi
  alasan failover untuk error throttle/not-ready khusus Bedrock, ditambah
  keluarga replay bersama `anthropic-by-model` untuk guard kebijakan replay khusus Claude
  pada trafik Anthropic
- `anthropic-vertex`: guard kebijakan replay khusus Claude pada trafik
  pesan Anthropic
- `openrouter`: id model pass-through, wrapper request, petunjuk capability provider,
  sanitasi thought-signature Gemini pada trafik Gemini melalui proxy,
  injeksi reasoning proxy melalui keluarga stream `openrouter-thinking`, penerusan
  metadata routing, dan kebijakan cache-TTL
- `github-copilot`: onboarding/login perangkat, fallback model kompatibilitas-maju,
  petunjuk transkrip Claude-thinking, pertukaran token runtime, dan pengambilan
  endpoint usage
- `openai`: fallback kompatibilitas-maju GPT-5.4, normalisasi transport OpenAI langsung,
  petunjuk missing-auth yang sadar-Codex, penekanan Spark, baris katalog
  OpenAI/Codex sintetis, kebijakan thinking/model live, normalisasi alias token usage
  (`input` / `output` dan keluarga `prompt` / `completion`), keluarga stream bersama
  `openai-responses-defaults` untuk wrapper OpenAI/Codex native, metadata keluarga-provider,
  pendaftaran provider generasi gambar bawaan
  untuk `gpt-image-1`, dan pendaftaran provider generasi video bawaan
  untuk `sora-2`
- `google` dan `google-gemini-cli`: fallback kompatibilitas-maju Gemini 3.1,
  validasi replay Gemini native, sanitasi replay bootstrap, mode output reasoning
  bertag, pencocokan model modern, pendaftaran provider generasi gambar bawaan
  untuk model Gemini image-preview, dan pendaftaran provider generasi video bawaan
  untuk model Veo; Gemini CLI OAuth juga
  memiliki pemformatan token profil auth, parsing token usage, dan pengambilan endpoint kuota untuk permukaan usage
- `moonshot`: transport bersama, normalisasi payload thinking milik plugin
- `kilocode`: transport bersama, header request milik plugin, normalisasi payload reasoning,
  sanitasi thought-signature proxy-Gemini, dan kebijakan cache-TTL
- `zai`: fallback kompatibilitas-maju GLM-5, default `tool_stream`, kebijakan cache-TTL,
  kebijakan thinking biner/model live, serta auth usage + pengambilan kuota;
  id `glm-5*` yang tidak dikenal disintesis dari templat bawaan `glm-4.7`
- `xai`: normalisasi transport Responses native, penulisan ulang alias `/fast` untuk
  varian cepat Grok, default `tool_stream`, pembersihan tool-schema /
  payload reasoning khusus xAI, dan pendaftaran provider generasi video bawaan
  untuk `grok-imagine-video`
- `mistral`: metadata capability milik plugin
- `opencode` dan `opencode-go`: metadata capability milik plugin ditambah
  sanitasi thought-signature proxy-Gemini
- `alibaba`: katalog generasi video milik plugin untuk referensi model Wan langsung
  seperti `alibaba/wan2.6-t2v`
- `byteplus`: katalog milik plugin ditambah pendaftaran provider generasi video bawaan
  untuk model Seedance text-to-video/image-to-video
- `fal`: pendaftaran provider generasi video bawaan untuk model pihak ketiga ter-host
  serta pendaftaran provider generasi gambar untuk model gambar FLUX ditambah pendaftaran provider generasi video bawaan untuk model video pihak ketiga ter-host
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway`, dan `volcengine`:
  hanya katalog milik plugin
- `qwen`: katalog milik plugin untuk model teks ditambah pendaftaran provider
  pemahaman media dan generasi video bersama untuk permukaan multimodalnya;
  generasi video Qwen menggunakan endpoint video Standard DashScope dengan model Wan bawaan seperti `wan2.6-t2v` dan `wan2.7-r2v`
- `runway`: pendaftaran provider generasi video milik plugin untuk model native
  berbasis tugas Runway seperti `gen4.5`
- `minimax`: katalog milik plugin, pendaftaran provider generasi video bawaan
  untuk model video Hailuo, pendaftaran provider generasi gambar bawaan
  untuk `image-01`, pemilihan kebijakan replay hibrida Anthropic/OpenAI, dan logika auth/snapshot usage
- `together`: katalog milik plugin ditambah pendaftaran provider generasi video bawaan
  untuk model video Wan
- `xiaomi`: katalog milik plugin ditambah logika auth/snapshot usage

Plugin `openai` bawaan kini memiliki kedua id provider: `openai` dan
`openai-codex`.

Itu mencakup provider yang masih cocok dengan transport normal OpenClaw. Provider
yang memerlukan eksekutor request kustom sepenuhnya adalah permukaan extension
terpisah yang lebih dalam.

## Rotasi API key

- Mendukung rotasi provider generik untuk provider tertentu.
- Konfigurasikan beberapa key melalui:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (satu override live, prioritas tertinggi)
  - `<PROVIDER>_API_KEYS` (daftar dipisahkan koma atau titik koma)
  - `<PROVIDER>_API_KEY` (key utama)
  - `<PROVIDER>_API_KEY_*` (daftar bernomor, misalnya `<PROVIDER>_API_KEY_1`)
- Untuk provider Google, `GOOGLE_API_KEY` juga disertakan sebagai fallback.
- Urutan pemilihan key mempertahankan prioritas dan menghapus duplikasi nilai.
- Request dicoba ulang dengan key berikutnya hanya pada respons rate-limit (misalnya
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, atau pesan batas usage berkala).
- Kegagalan non-rate-limit langsung gagal; tidak ada rotasi key yang dicoba.
- Ketika semua key kandidat gagal, error akhir dikembalikan dari percobaan terakhir.

## Provider bawaan (katalog pi-ai)

OpenClaw dikirim dengan katalog pi‑ai. Provider ini **tidak**
memerlukan konfigurasi `models.providers`; cukup set auth + pilih model.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Rotasi opsional: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ditambah `OPENCLAW_LIVE_OPENAI_KEY` (satu override)
- Contoh model: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport default adalah `auto` (WebSocket lebih dulu, fallback SSE)
- Timpa per model melalui `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- Warm-up OpenAI Responses WebSocket default-nya aktif melalui `params.openaiWsWarmup` (`true`/`false`)
- Pemrosesan prioritas OpenAI dapat diaktifkan melalui `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` dan `params.fastMode` memetakan request Responses `openai/*` langsung ke `service_tier=priority` pada `api.openai.com`
- Gunakan `params.serviceTier` ketika Anda ingin tier eksplisit alih-alih toggle `/fast` bersama
- Header atribusi OpenClaw tersembunyi (`originator`, `version`,
  `User-Agent`) hanya berlaku pada trafik OpenAI native ke `api.openai.com`, bukan
  proxy generik yang kompatibel dengan OpenAI
- Rute OpenAI native juga mempertahankan Responses `store`, petunjuk prompt-cache, dan
  pembentukan payload kompatibilitas reasoning OpenAI; rute proxy tidak
- `openai/gpt-5.3-codex-spark` sengaja ditekan di OpenClaw karena API OpenAI live menolaknya; Spark diperlakukan sebagai khusus Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Rotasi opsional: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, ditambah `OPENCLAW_LIVE_ANTHROPIC_KEY` (satu override)
- Contoh model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Request Anthropic publik langsung mendukung toggle `/fast` bersama dan `params.fastMode`, termasuk trafik yang diautentikasi dengan API key dan OAuth yang dikirim ke `api.anthropic.com`; OpenClaw memetakannya ke Anthropic `service_tier` (`auto` vs `standard_only`)
- Catatan Anthropic: staf Anthropic memberi tahu kami bahwa penggunaan Claude CLI gaya OpenClaw diizinkan kembali, jadi OpenClaw memperlakukan penggunaan ulang Claude CLI dan penggunaan `claude -p` sebagai hal yang disetujui untuk integrasi ini kecuali Anthropic menerbitkan kebijakan baru.
- Setup-token Anthropic tetap tersedia sebagai jalur token OpenClaw yang didukung, tetapi OpenClaw sekarang lebih memilih penggunaan ulang Claude CLI dan `claude -p` bila tersedia.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Contoh model: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` atau `openclaw models auth login --provider openai-codex`
- Transport default adalah `auto` (WebSocket lebih dulu, fallback SSE)
- Timpa per model melalui `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, atau `"auto"`)
- `params.serviceTier` juga diteruskan pada request Responses Codex native (`chatgpt.com/backend-api`)
- Header atribusi OpenClaw tersembunyi (`originator`, `version`,
  `User-Agent`) hanya dilampirkan pada trafik Codex native ke
  `chatgpt.com/backend-api`, bukan proxy generik yang kompatibel dengan OpenAI
- Berbagi toggle `/fast` dan konfigurasi `params.fastMode` yang sama seperti `openai/*` langsung; OpenClaw memetakannya ke `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` tetap tersedia ketika katalog OAuth Codex mengeksposnya; bergantung pada entitlement
- `openai-codex/gpt-5.4` mempertahankan `contextWindow = 1050000` native dan default runtime `contextTokens = 272000`; timpa batas runtime dengan `models.providers.openai-codex.models[].contextTokens`
- Catatan kebijakan: OpenAI Codex OAuth secara eksplisit didukung untuk alat/alur kerja eksternal seperti OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Opsi host bergaya langganan lainnya

- [Qwen Cloud](/id/providers/qwen): permukaan provider Qwen Cloud ditambah pemetaan endpoint Alibaba DashScope dan Coding Plan
- [MiniMax](/id/providers/minimax): akses OAuth atau API key MiniMax Coding Plan
- [GLM Models](/id/providers/glm): endpoint Z.AI Coding Plan atau API umum

### OpenCode

- Auth: `OPENCODE_API_KEY` (atau `OPENCODE_ZEN_API_KEY`)
- Provider runtime Zen: `opencode`
- Provider runtime Go: `opencode-go`
- Contoh model: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
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
- Kompatibilitas: konfigurasi OpenClaw lama yang menggunakan `google/gemini-3.1-flash-preview` dinormalkan menjadi `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Eksekusi Gemini langsung juga menerima `agents.defaults.models["google/<model>"].params.cachedContent`
  (atau `cached_content` lama) untuk meneruskan handle
  `cachedContents/...` native provider; hit cache Gemini muncul sebagai OpenClaw `cacheRead`

### Google Vertex dan Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex menggunakan gcloud ADC; Gemini CLI menggunakan alur OAuth-nya
- Perhatian: OAuth Gemini CLI di OpenClaw adalah integrasi tidak resmi. Beberapa pengguna melaporkan pembatasan akun Google setelah menggunakan klien pihak ketiga. Tinjau persyaratan Google dan gunakan akun yang tidak kritis jika Anda memilih untuk melanjutkan.
- OAuth Gemini CLI dikirim sebagai bagian dari plugin `google` bawaan.
  - Instal Gemini CLI terlebih dahulu:
    - `brew install gemini-cli`
    - atau `npm install -g @google/gemini-cli`
  - Aktifkan: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Model default: `google-gemini-cli/gemini-3-flash-preview`
  - Catatan: Anda **tidak** menempelkan client id atau secret ke dalam `openclaw.json`. Alur login CLI menyimpan
    token di profil auth pada host gateway.
  - Jika request gagal setelah login, set `GOOGLE_CLOUD_PROJECT` atau `GOOGLE_CLOUD_PROJECT_ID` pada host gateway.
  - Balasan JSON Gemini CLI di-parse dari `response`; usage fallback ke
    `stats`, dengan `stats.cached` dinormalkan menjadi OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Contoh model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Alias: `z.ai/*` dan `z-ai/*` dinormalkan menjadi `zai/*`
  - `zai-api-key` mendeteksi otomatis endpoint Z.AI yang cocok; `zai-coding-global`, `zai-coding-cn`, `zai-global`, dan `zai-cn` memaksa permukaan tertentu

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Contoh model: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Contoh model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Katalog fallback statis menyertakan `kilocode/kilo/auto`; discovery live
  `https://api.kilo.ai/api/gateway/models` dapat memperluas katalog runtime
  lebih lanjut.
- Perutean upstream yang tepat di balik `kilocode/kilo/auto` dimiliki oleh Kilo Gateway,
  bukan dikodekan secara tetap di OpenClaw.

Lihat [/providers/kilocode](/id/providers/kilocode) untuk detail penyiapan.

### Plugin provider bawaan lainnya

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Contoh model: `openrouter/auto`
- OpenClaw menerapkan header atribusi aplikasi yang didokumentasikan OpenRouter hanya ketika
  request benar-benar menargetkan `openrouter.ai`
- Penanda Anthropic `cache_control` khusus OpenRouter juga dibatasi ke
  rute OpenRouter yang terverifikasi, bukan URL proxy sembarang
- OpenRouter tetap berada pada jalur kompatibel OpenAI bergaya proxy, sehingga
  pembentukan request yang hanya native OpenAI (`serviceTier`, Responses `store`,
  petunjuk prompt-cache, payload kompatibilitas reasoning OpenAI) tidak diteruskan
- Referensi OpenRouter berbasis Gemini hanya mempertahankan sanitasi thought-signature proxy-Gemini;
  validasi replay Gemini native dan penulisan ulang bootstrap tetap nonaktif
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Contoh model: `kilocode/kilo/auto`
- Referensi Kilo berbasis Gemini mempertahankan jalur sanitasi thought-signature
  proxy-Gemini yang sama; `kilocode/kilo/auto` dan petunjuk unsupported proxy-reasoning lainnya
  melewati injeksi reasoning proxy
- MiniMax: `minimax` (API key) dan `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` untuk `minimax`; `MINIMAX_OAUTH_TOKEN` atau `MINIMAX_API_KEY` untuk `minimax-portal`
- Contoh model: `minimax/MiniMax-M2.7` atau `minimax-portal/MiniMax-M2.7`
- Onboarding/penyiapan API key MiniMax menulis definisi model M2.7 eksplisit dengan
  `input: ["text", "image"]`; katalog provider bawaan menjaga referensi chat
  tetap text-only sampai konfigurasi provider itu dimaterialisasi
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Contoh model: `moonshot/kimi-k2.6`
- Kimi Coding: `kimi` (`KIMI_API_KEY` atau `KIMICODE_API_KEY`)
- Contoh model: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Contoh model: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY`, atau `DASHSCOPE_API_KEY`)
- Contoh model: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Contoh model: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Contoh model: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Contoh model: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Contoh model: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` atau `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Contoh model: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Contoh model: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Request xAI bawaan native menggunakan jalur xAI Responses
  - `/fast` atau `params.fastMode: true` menulis ulang `grok-3`, `grok-3-mini`,
    `grok-4`, dan `grok-4-0709` ke varian `*-fast` masing-masing
  - `tool_stream` default-nya aktif; set
    `agents.defaults.models["xai/<model>"].params.tool_stream` ke `false` untuk
    menonaktifkannya
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Contoh model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Model GLM di Cerebras menggunakan id `zai-glm-4.7` dan `zai-glm-4.6`.
  - Base URL kompatibel OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Contoh model Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Lihat [Hugging Face (Inference)](/id/providers/huggingface).

## Provider melalui `models.providers` (kustom/base URL)

Gunakan `models.providers` (atau `models.json`) untuk menambahkan provider **kustom** atau
proxy yang kompatibel dengan OpenAI/Anthropic.

Banyak plugin provider bawaan di bawah ini sudah menerbitkan katalog default.
Gunakan entri `models.providers.<id>` eksplisit hanya ketika Anda ingin menimpa
base URL, header, atau daftar model default.

### Moonshot AI (Kimi)

Moonshot dikirim sebagai plugin provider bawaan. Gunakan provider bawaan secara
default, dan tambahkan entri `models.providers.moonshot` eksplisit hanya ketika Anda
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

Volcano Engine (火山引擎) menyediakan akses ke Doubao dan model lain di Tiongkok.

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
juga didaftarkan pada saat yang sama.

Dalam pemilih model onboarding/konfigurasi, pilihan auth Volcengine memprioritaskan kedua
baris `volcengine/*` dan `volcengine-plan/*`. Jika model tersebut belum dimuat,
OpenClaw fallback ke katalog tanpa filter alih-alih menampilkan pemilih
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

BytePlus ARK menyediakan akses ke model yang sama dengan Volcano Engine untuk pengguna internasional.

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
juga didaftarkan pada saat yang sama.

Dalam pemilih model onboarding/konfigurasi, pilihan auth BytePlus memprioritaskan kedua
baris `byteplus/*` dan `byteplus-plan/*`. Jika model tersebut belum dimuat,
OpenClaw fallback ke katalog tanpa filter alih-alih menampilkan pemilih
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

Lihat [/providers/minimax](/id/providers/minimax) untuk detail penyiapan, opsi model, dan cuplikan konfigurasi.

Pada jalur streaming MiniMax yang kompatibel dengan Anthropic, OpenClaw menonaktifkan thinking secara
default kecuali Anda menyetelnya secara eksplisit, dan `/fast on` menulis ulang
`MiniMax-M2.7` menjadi `MiniMax-M2.7-highspeed`.

Pemisahan capability milik plugin:

- Default teks/obrolan tetap pada `minimax/MiniMax-M2.7`
- Generasi gambar adalah `minimax/image-01` atau `minimax-portal/image-01`
- Pemahaman gambar adalah `MiniMax-VL-01` milik plugin pada kedua jalur auth MiniMax
- Pencarian web tetap pada id provider `minimax`

### LM Studio

LM Studio dikirim sebagai plugin provider bawaan yang menggunakan API native:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- Base URL inferensi default: `http://localhost:1234/v1`

Lalu setel model (ganti dengan salah satu ID yang dikembalikan oleh `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw menggunakan `/api/v1/models` dan `/api/v1/models/load` native LM Studio
untuk discovery + auto-load, dengan `/v1/chat/completions` untuk inferensi secara default.
Lihat [/providers/lmstudio](/id/providers/lmstudio) untuk penyiapan dan pemecahan masalah.

### Ollama

Ollama dikirim sebagai plugin provider bawaan dan menggunakan API native Ollama:

- Provider: `ollama`
- Auth: Tidak diperlukan (server lokal)
- Contoh model: `ollama/llama3.3`
- Instalasi: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
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
`OLLAMA_API_KEY`, dan plugin provider bawaan menambahkan Ollama langsung ke
`openclaw onboard` dan pemilih model. Lihat [/providers/ollama](/id/providers/ollama)
untuk onboarding, mode cloud/lokal, dan konfigurasi kustom.

### vLLM

vLLM dikirim sebagai plugin provider bawaan untuk server lokal/self-hosted yang kompatibel dengan OpenAI:

- Provider: `vllm`
- Auth: Opsional (tergantung server Anda)
- Base URL default: `http://127.0.0.1:8000/v1`

Untuk ikut serta dalam auto-discovery secara lokal (nilai apa pun berfungsi jika server Anda tidak memaksa auth):

```bash
export VLLM_API_KEY="vllm-local"
```

Lalu setel model (ganti dengan salah satu ID yang dikembalikan oleh `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Lihat [/providers/vllm](/id/providers/vllm) untuk detail.

### SGLang

SGLang dikirim sebagai plugin provider bawaan untuk server self-hosted cepat yang kompatibel dengan OpenAI:

- Provider: `sglang`
- Auth: Opsional (tergantung server Anda)
- Base URL default: `http://127.0.0.1:30000/v1`

Untuk ikut serta dalam auto-discovery secara lokal (nilai apa pun berfungsi jika server Anda tidak
memaksa auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

Lalu setel model (ganti dengan salah satu ID yang dikembalikan oleh `/v1/models`):

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
  Jika dihilangkan, OpenClaw menggunakan default:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Direkomendasikan: setel nilai eksplisit yang sesuai dengan batas proxy/model Anda.
- Untuk `api: "openai-completions"` pada endpoint non-native (setiap `baseUrl` tidak kosong yang host-nya bukan `api.openai.com`), OpenClaw memaksa `compat.supportsDeveloperRole: false` untuk menghindari error provider 400 untuk role `developer` yang tidak didukung.
- Rute kompatibel OpenAI bergaya proxy juga melewati pembentukan request yang hanya native OpenAI:
  tanpa `service_tier`, tanpa Responses `store`, tanpa petunjuk prompt-cache, tanpa
  pembentukan payload kompatibilitas reasoning OpenAI, dan tanpa header atribusi OpenClaw tersembunyi.
- Jika `baseUrl` kosong/tidak diisi, OpenClaw mempertahankan perilaku OpenAI default (yang di-resolve ke `api.openai.com`).
- Demi keamanan, `compat.supportsDeveloperRole: true` yang eksplisit tetap ditimpa pada endpoint `openai-completions` non-native.

## Contoh CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Lihat juga: [/gateway/configuration](/id/gateway/configuration) untuk contoh konfigurasi lengkap.

## Terkait

- [Models](/id/concepts/models) — konfigurasi model dan alias
- [Model Failover](/id/concepts/model-failover) — rantai fallback dan perilaku retry
- [Configuration Reference](/id/gateway/configuration-reference#agent-defaults) — kunci konfigurasi model
- [Providers](/id/providers) — panduan penyiapan per provider
