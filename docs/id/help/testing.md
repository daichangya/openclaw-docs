---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan regresi untuk bug model/provider
    - Men-debug perilaku gateway + agent
summary: 'Kit pengujian: suite unit/e2e/live, runner Docker, dan cakupan tiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-04-09T01:30:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01117f41d8b171a4f1da11ed78486ee700e70ae70af54eb6060c57baf64ab21b
    source_path: help/testing.md
    workflow: 15
---

# Pengujian

OpenClaw memiliki tiga suite Vitest (unit/integrasi, e2e, live) dan sekumpulan kecil runner Docker.

Dokumen ini adalah panduan “cara kami melakukan pengujian”:

- Apa yang dicakup oleh setiap suite (dan apa yang sengaja _tidak_ dicakup)
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, sebelum push, debugging)
- Cara live test menemukan kredensial dan memilih model/provider
- Cara menambahkan regresi untuk masalah model/provider di dunia nyata

## Mulai cepat

Hampir setiap hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm test`
- Eksekusi full-suite lokal yang lebih cepat pada mesin yang lega: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung kini juga merutekan path extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Situs QA berbasis Docker: `pnpm qa:lab:up`

Saat Anda menyentuh pengujian atau ingin keyakinan tambahan:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug provider/model nyata (memerlukan kredensial nyata):

- Suite live (probe model + tool/image gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Tip: ketika Anda hanya memerlukan satu kasus gagal, sebaiknya persempit live test melalui env var allowlist yang dijelaskan di bawah.

## Suite pengujian (apa yang berjalan di mana)

Anggap suite-suite ini sebagai “realisme yang semakin meningkat” (dan flakiness/biaya yang juga meningkat):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfigurasi: sepuluh eksekusi shard berurutan (`vitest.full-*.config.ts`) di atas project Vitest terlingkup yang ada
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, dan pengujian node `ui` yang di-whitelist yang dicakup oleh `vitest.unit.config.ts`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi in-process (auth gateway, routing, tooling, parsing, config)
  - Regresi deterministik untuk bug yang sudah diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan key nyata
  - Harus cepat dan stabil
- Catatan project:
  - `pnpm test` tanpa target kini menjalankan sebelas konfigurasi shard yang lebih kecil (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses root-project native yang sangat besar. Ini mengurangi puncak RSS pada mesin yang sibuk dan mencegah pekerjaan auto-reply/extension mengganggu suite lain yang tidak terkait.
  - `pnpm test --watch` tetap menggunakan graf project `vitest.config.ts` root native, karena loop watch multi-shard tidak praktis.
  - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane terlingkup terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tidak perlu membayar biaya startup penuh root project.
  - `pnpm test:changed` memperluas path git yang berubah ke lane terlingkup yang sama saat diff hanya menyentuh file source/test yang dapat dirutekan; edit config/setup tetap fallback ke rerun root-project yang luas.
  - Pengujian `plugin-sdk` dan `commands` tertentu juga dirutekan melalui lane ringan khusus yang melewati `test/setup-openclaw-runtime.ts`; file stateful/runtime-heavy tetap berada di lane yang ada.
  - File source helper `plugin-sdk` dan `commands` tertentu juga memetakan eksekusi mode-changed ke pengujian saudara eksplisit di lane ringan tersebut, sehingga edit helper tidak memicu rerun suite berat penuh untuk direktori itu.
  - `auto-reply` sekarang memiliki tiga bucket khusus: helper core tingkat atas, pengujian integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. Ini menjaga pekerjaan harness reply terberat tetap terpisah dari pengujian status/chunk/token yang murah.
- Catatan embedded runner:
  - Saat Anda mengubah input penemuan message-tool atau konteks runtime compaction,
    pertahankan kedua tingkat cakupan.
  - Tambahkan regresi helper yang terfokus untuk batas routing/normalisasi murni.
  - Jaga juga suite integrasi embedded runner tetap sehat:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Suite-suite tersebut memverifikasi bahwa id terlingkup dan perilaku compaction tetap mengalir
    melalui path `run.ts` / `compact.ts` yang nyata; pengujian helper saja bukan
    pengganti yang memadai untuk path integrasi tersebut.
- Catatan pool:
  - Konfigurasi dasar Vitest sekarang menggunakan `threads` secara default.
  - Konfigurasi Vitest bersama juga menetapkan `isolate: false` dan menggunakan runner non-isolated di seluruh konfigurasi root project, e2e, dan live.
  - Lane UI root mempertahankan setup dan optimizer `jsdom`, tetapi sekarang juga berjalan pada runner non-isolated bersama.
  - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false` yang sama dari konfigurasi Vitest bersama.
  - Launcher bersama `scripts/run-vitest.mjs` sekarang juga menambahkan `--no-maglev` untuk proses Node anak Vitest secara default guna mengurangi churn kompilasi V8 selama eksekusi lokal besar. Tetapkan `OPENCLAW_VITEST_ENABLE_MAGLEV=1` jika Anda perlu membandingkan dengan perilaku V8 bawaan.
- Catatan iterasi lokal cepat:
  - `pnpm test:changed` merutekan melalui lane terlingkup saat path yang berubah dipetakan dengan bersih ke suite yang lebih kecil.
  - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing yang sama, hanya dengan batas worker yang lebih tinggi.
  - Auto-scaling worker lokal kini sengaja lebih konservatif dan juga mundur saat load average host sudah tinggi, sehingga beberapa eksekusi Vitest bersamaan menimbulkan dampak yang lebih kecil secara default.
  - Konfigurasi dasar Vitest menandai file projects/config sebagai `forceRerunTriggers` agar rerun mode-changed tetap benar saat wiring pengujian berubah.
  - Konfigurasi mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` tetap aktif pada host yang didukung; tetapkan `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda ingin satu lokasi cache eksplisit untuk profiling langsung.
- Catatan debug performa:
  - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest beserta keluaran rincian impor.
  - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan `test:changed` yang dirutekan dengan path root-project native untuk diff yang telah di-commit tersebut dan mencetak wall time beserta max RSS macOS.
- `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark pada tree kotor saat ini dengan merutekan daftar file yang berubah melalui `scripts/test-projects.mjs` dan konfigurasi Vitest root.
  - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk overhead startup dan transform Vitest/Vite.
  - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk suite unit dengan paralelisme file dinonaktifkan.

### E2E (smoke gateway)

- Perintah: `pnpm test:e2e`
- Konfigurasi: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Default runtime:
  - Menggunakan Vitest `threads` dengan `isolate: false`, konsisten dengan bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Override yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi hingga 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali keluaran konsol verbose.
- Cakupan:
  - Perilaku end-to-end gateway multi-instance
  - Surface WebSocket/HTTP, pairing node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (saat diaktifkan dalam pipeline)
  - Tidak memerlukan key nyata
  - Lebih banyak bagian bergerak dibanding pengujian unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `test/openshell-sandbox.e2e.test.ts`
- Cakupan:
  - Memulai gateway OpenShell terisolasi pada host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menjalankan backend OpenShell OpenClaw melalui `sandbox ssh-config` + eksekusi SSH yang nyata
  - Memverifikasi perilaku filesystem remote-canonical melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari eksekusi default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` yang terisolasi, lalu menghancurkan gateway dan sandbox pengujian
- Override yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke biner CLI non-default atau skrip wrapper

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Konfigurasi: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`
- Default: **diaktifkan** oleh `pnpm test:live` (menetapkan `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah provider/model ini benar-benar bekerja _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format provider, keanehan tool-calling, masalah auth, dan perilaku rate limit
- Ekspektasi:
  - Memang tidak stabil untuk CI (jaringan nyata, kebijakan provider nyata, kuota, outage)
  - Menghabiskan biaya / menggunakan rate limit
  - Sebaiknya menjalankan subset yang dipersempit, bukan “semuanya”
- Live run melakukan source `~/.profile` untuk mengambil API key yang belum ada.
- Secara default, live run tetap mengisolasi `HOME` dan menyalin materi config/auth ke home pengujian sementara agar fixture unit tidak dapat mengubah `~/.openclaw` asli Anda.
- Tetapkan `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya saat Anda memang ingin live test menggunakan direktori home asli Anda.
- `pnpm test:live` kini default ke mode yang lebih senyap: tetap mempertahankan keluaran progres `[live] ...`, tetapi menekan notifikasi `~/.profile` tambahan dan membisukan log bootstrap gateway/chatter Bonjour. Tetapkan `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup penuh kembali.
- Rotasi API key (spesifik provider): tetapkan `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; pengujian akan mencoba ulang saat mendapat respons rate limit.
- Keluaran progres/heartbeat:
  - Suite live sekarang mengeluarkan baris progres ke stderr sehingga pemanggilan provider yang lama tetap tampak aktif meskipun capture konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres provider/gateway mengalir segera selama live run.
  - Atur heartbeat direct-model dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Atur heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug “bot saya down” / kegagalan spesifik provider / tool calling: jalankan `pnpm test:live` yang dipersempit

## Live: sweep kapabilitas node Android

- Pengujian: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: memanggil **setiap perintah yang saat ini diiklankan** oleh node Android yang terhubung dan memverifikasi perilaku kontrak perintah.
- Cakupan:
  - Setup manual dengan prasyarat (suite ini tidak memasang/menjalankan/mem-pair aplikasi).
  - Validasi gateway `node.invoke` per perintah untuk node Android yang dipilih.
- Pra-setup yang diperlukan:
  - Aplikasi Android sudah terhubung + ter-pair ke gateway.
  - Aplikasi tetap berada di foreground.
  - Izin/persetujuan capture diberikan untuk kapabilitas yang Anda harapkan lolos.
- Override target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail setup Android lengkap: [Android App](/id/platforms/android)

## Live: smoke model (key profil)

Live test dibagi menjadi dua lapisan agar kita dapat mengisolasi kegagalan:

- “Direct model” memberi tahu kita apakah provider/model dapat menjawab sama sekali dengan key yang diberikan.
- “Gateway smoke” memberi tahu kita apakah seluruh pipeline gateway+agent bekerja untuk model itu (session, history, tools, kebijakan sandbox, dan sebagainya).

### Lapisan 1: Penyelesaian direct model (tanpa gateway)

- Pengujian: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Mengenumerasi model yang ditemukan
  - Menggunakan `getApiKeyForModel` untuk memilih model yang Anda miliki kredensialnya
  - Menjalankan penyelesaian kecil per model (dan regresi terarah bila perlu)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Tetapkan `OPENCLAW_LIVE_MODELS=modern` (atau `all`, alias untuk modern) agar suite ini benar-benar berjalan; jika tidak, suite ini akan di-skip agar `pnpm test:live` tetap fokus pada gateway smoke
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` untuk menjalankan allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk allowlist modern
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist dipisahkan koma)
  - Sweep modern/all default ke batas kurasi dengan sinyal tinggi; tetapkan `OPENCLAW_LIVE_MAX_MODELS=0` untuk sweep modern lengkap atau angka positif untuk batas yang lebih kecil.
- Cara memilih provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist dipisahkan koma)
- Dari mana key berasal:
  - Default: profile store dan fallback env
  - Tetapkan `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa hanya **profile store**
- Mengapa ini ada:
  - Memisahkan “API provider rusak / key tidak valid” dari “pipeline agent gateway rusak”
  - Menampung regresi kecil yang terisolasi (contoh: replay reasoning OpenAI Responses/Codex Responses + alur tool-call)

### Lapisan 2: Gateway + smoke dev agent (apa yang sebenarnya dilakukan "@openclaw")

- Pengujian: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Menjalankan gateway in-process
  - Membuat/menambal session `agent:dev:*` (override model per eksekusi)
  - Mengiterasi model-dengan-key dan memverifikasi:
    - respons “bermakna” (tanpa tools)
    - pemanggilan tool nyata berfungsi (probe read)
    - probe tool tambahan opsional (probe exec+read)
    - path regresi OpenAI (hanya tool-call → tindak lanjut) tetap berfungsi
- Detail probe (agar Anda dapat menjelaskan kegagalan dengan cepat):
  - probe `read`: pengujian menulis file nonce di workspace lalu meminta agent `read` file tersebut dan mengembalikan nonce.
  - probe `exec+read`: pengujian meminta agent menulis nonce ke file sementara via `exec`, lalu `read` kembali.
  - probe gambar: pengujian melampirkan PNG yang dihasilkan (kucing + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `src/gateway/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Cara memilih model:
  - Default: allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk allowlist modern
  - Atau tetapkan `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar dipisahkan koma) untuk mempersempit
  - Sweep gateway modern/all default ke batas kurasi dengan sinyal tinggi; tetapkan `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk sweep modern lengkap atau angka positif untuk batas yang lebih kecil.
- Cara memilih provider (hindari “semua OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist dipisahkan koma)
- Probe tool + gambar selalu aktif di live test ini:
  - probe `read` + probe `exec+read` (stress tool)
  - probe gambar berjalan saat model mengiklankan dukungan input gambar
  - Alur (tingkat tinggi):
    - Pengujian menghasilkan PNG kecil dengan “CAT” + kode acak (`src/gateway/live-image-probe.ts`)
    - Mengirimkannya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mem-parsing attachment menjadi `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent meneruskan pesan pengguna multimodal ke model
    - Asersi: balasan berisi `cat` + kode tersebut (toleransi OCR: kesalahan kecil diperbolehkan)

Tip: untuk melihat apa yang bisa Anda uji pada mesin Anda (dan id `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backend CLI (Claude, Codex, Gemini, atau CLI lokal lain)

- Pengujian: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: memvalidasi pipeline Gateway + agent menggunakan backend CLI lokal, tanpa menyentuh config default Anda.
- Default smoke spesifik backend berada bersama definisi `cli-backend.ts` milik extension yang bersangkutan.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Default:
  - Provider/model default: `claude-cli/claude-sonnet-4-6`
  - Perilaku command/args/image berasal dari metadata plugin backend CLI yang memilikinya.
- Override (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim attachment gambar nyata (path disuntikkan ke prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path file gambar sebagai argumen CLI alih-alih injeksi prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengendalikan cara argumen gambar diteruskan saat `IMAGE_ARG` ditetapkan.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` untuk menonaktifkan probe kontinuitas satu session default Claude Sonnet -> Opus (tetapkan ke `1` untuk memaksanya aktif saat model yang dipilih mendukung target switch).

Contoh:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Resep Docker:

```bash
pnpm test:docker:live-cli-backend
```

Resep Docker penyedia tunggal:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Catatan:

- Runner Docker berada di `scripts/test-live-cli-backend-docker.sh`.
- Runner ini menjalankan smoke CLI-backend live di dalam image Docker repo sebagai pengguna non-root `node`.
- Runner ini me-resolve metadata smoke CLI dari extension yang memilikinya, lalu memasang paket CLI Linux yang sesuai (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) ke prefix writable yang di-cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (default: `~/.cache/openclaw/docker-cli-tools`).
- Smoke CLI-backend live sekarang menjalankan alur end-to-end yang sama untuk Claude, Codex, dan Gemini: giliran teks, giliran klasifikasi gambar, lalu pemanggilan tool MCP `cron` yang diverifikasi melalui CLI gateway.
- Smoke default Claude juga menambal session dari Sonnet ke Opus dan memverifikasi session yang dilanjutkan masih mengingat catatan sebelumnya.

## Live: smoke bind ACP (`/acp spawn ... --bind here`)

- Pengujian: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur bind percakapan ACP nyata dengan agent ACP live:
  - kirim `/acp spawn <agent> --bind here`
  - bind percakapan message-channel sintetis di tempat
  - kirim tindak lanjut normal pada percakapan yang sama
  - verifikasi tindak lanjut masuk ke transkrip session ACP yang terikat
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Default:
  - Agent ACP di Docker: `claude,codex,gemini`
  - Agent ACP untuk `pnpm test:live ...` langsung: `claude`
  - Channel sintetis: konteks percakapan bergaya Slack DM
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Catatan:
  - Lane ini menggunakan surface gateway `chat.send` dengan field originating-route sintetis khusus admin agar pengujian dapat melampirkan konteks message-channel tanpa berpura-pura melakukan pengiriman eksternal.
  - Saat `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak ditetapkan, pengujian ini menggunakan registry agent bawaan plugin `acpx` embedded untuk agent harness ACP yang dipilih.

Contoh:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Resep Docker:

```bash
pnpm test:docker:live-acp-bind
```

Resep Docker agen tunggal:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-acp-bind-docker.sh`.
- Secara default, runner ini menjalankan smoke bind ACP terhadap semua agent CLI live yang didukung secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` untuk mempersempit matriks.
- Runner ini melakukan source `~/.profile`, men-stage materi auth CLI yang sesuai ke container, memasang `acpx` ke prefix npm yang writable, lalu memasang CLI live yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) jika belum ada.
- Di dalam Docker, runner menetapkan `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` agar acpx mempertahankan env var provider dari profile yang telah di-source tetap tersedia untuk CLI harness anak.

### Resep live yang direkomendasikan

Allowlist yang sempit dan eksplisit paling cepat dan paling sedikit flakey:

- Satu model, direct (tanpa gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Satu model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling di beberapa provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus Google (API key Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Catatan:

- `google/...` menggunakan Gemini API (API key).
- `google-antigravity/...` menggunakan bridge OAuth Antigravity (endpoint agent bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan CLI Gemini lokal di mesin Anda (auth dan keanehan tooling terpisah).
- Gemini API vs Gemini CLI:
  - API: OpenClaw memanggil Gemini API yang di-host Google melalui HTTP (API key / auth profil); inilah yang biasanya dimaksud kebanyakan pengguna dengan “Gemini”.
  - CLI: OpenClaw melakukan shell out ke biner `gemini` lokal; ini memiliki auth sendiri dan dapat berperilaku berbeda (streaming/dukungan tool/perbedaan versi).

## Live: matriks model (apa yang kami cakup)

Tidak ada “daftar model CI” yang tetap (live bersifat opt-in), tetapi ini adalah model-model **yang direkomendasikan** untuk dicakup secara rutin di mesin pengembang dengan key.

### Set smoke modern (tool calling + gambar)

Ini adalah eksekusi “model umum” yang kami harapkan tetap berfungsi:

- OpenAI (non-Codex): `openai/gpt-5.4` (opsional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` dan `google/gemini-3-flash-preview` (hindari model Gemini 2.x yang lebih lama)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` dan `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Jalankan gateway smoke dengan tools + gambar:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec opsional)

Pilih setidaknya satu per keluarga provider:

- OpenAI: `openai/gpt-5.4` (atau `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (atau `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cakupan tambahan opsional (bagus untuk dimiliki):

- xAI: `xai/grok-4` (atau versi terbaru yang tersedia)
- Mistral: `mistral/`… (pilih satu model yang mampu menggunakan tools dan Anda aktifkan)
- Cerebras: `cerebras/`… (jika Anda memiliki akses)
- LM Studio: `lmstudio/`… (lokal; tool calling bergantung pada mode API)

### Vision: pengiriman gambar (attachment → pesan multimodal)

Sertakan setidaknya satu model yang mendukung gambar di `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/varian OpenAI yang mendukung vision, dan sebagainya) untuk menjalankan probe gambar.

### Agregator / gateway alternatif

Jika Anda mengaktifkan key, kami juga mendukung pengujian melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat yang mendukung tool+gambar)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (auth melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Provider lain yang dapat Anda sertakan dalam matriks live (jika Anda memiliki kredensial/config):

- Built-in: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Melalui `models.providers` (endpoint kustom): `minimax` (cloud/API), plus proxy apa pun yang kompatibel dengan OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, dll.)

Tip: jangan mencoba meng-hardcode “semua model” di dokumentasi. Daftar otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` di mesin Anda + key apa pun yang tersedia.

## Kredensial (jangan pernah di-commit)

Live test menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktisnya:

- Jika CLI berfungsi, live test seharusnya menemukan key yang sama.
- Jika live test mengatakan “tidak ada kredensial”, debug dengan cara yang sama seperti Anda men-debug `openclaw models list` / pemilihan model.

- Profil auth per-agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah yang dimaksud dengan “profile keys” di live test)
- Config: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori status lama: `~/.openclaw/credentials/` (disalin ke home live yang di-stage jika ada, tetapi bukan penyimpanan utama profile-key)
- Eksekusi lokal live secara default menyalin config aktif, file `auth-profiles.json` per-agent, `credentials/` lama, dan direktori auth CLI eksternal yang didukung ke home pengujian sementara; home live yang di-stage melewati `workspace/` dan `sandboxes/`, dan override path `agents.*.workspace` / `agentDir` dihapus agar probe tidak menyentuh workspace host asli Anda.

Jika Anda ingin mengandalkan key env (misalnya diekspor di `~/.profile`), jalankan pengujian lokal setelah `source ~/.profile`, atau gunakan runner Docker di bawah (runner tersebut dapat me-mount `~/.profile` ke container).

## Live Deepgram (transkripsi audio)

- Pengujian: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live rencana coding BytePlus

- Pengujian: `src/agents/byteplus.live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media workflow ComfyUI

- Pengujian: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Menjalankan path image, video, dan `music_generate` comfy bawaan
  - Melewati setiap kapabilitas kecuali `models.providers.comfy.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman workflow comfy, polling, download, atau registrasi plugin

## Live pembuatan gambar

- Pengujian: `src/image-generation/runtime.live.test.ts`
- Perintah: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Mengenumerasi setiap plugin provider image-generation yang terdaftar
  - Memuat env var provider yang hilang dari login shell Anda (`~/.profile`) sebelum melakukan probe
  - Secara default menggunakan API key live/env lebih dahulu daripada profil auth yang disimpan, sehingga key pengujian lama di `auth-profiles.json` tidak menutupi kredensial shell asli
  - Melewati provider yang tidak memiliki auth/profil/model yang dapat digunakan
  - Menjalankan varian image-generation bawaan melalui kapabilitas runtime bersama:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider bawaan saat ini yang dicakup:
  - `openai`
  - `google`
- Penyempitan opsional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth profile-store dan mengabaikan override khusus env

## Live pembuatan musik

- Pengujian: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menjalankan path provider music-generation bawaan bersama
  - Saat ini mencakup Google dan MiniMax
  - Memuat env var provider dari login shell Anda (`~/.profile`) sebelum melakukan probe
  - Secara default menggunakan API key live/env lebih dahulu daripada profil auth yang disimpan, sehingga key pengujian lama di `auth-profiles.json` tidak menutupi kredensial shell asli
  - Melewati provider yang tidak memiliki auth/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan jika tersedia:
    - `generate` dengan input prompt saja
    - `edit` saat provider mendeklarasikan `capabilities.edit.enabled`
  - Cakupan current shared-lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy terpisah, bukan sweep bersama ini
- Penyempitan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth profile-store dan mengabaikan override khusus env

## Live pembuatan video

- Pengujian: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menjalankan path provider video-generation bawaan bersama
  - Memuat env var provider dari login shell Anda (`~/.profile`) sebelum melakukan probe
  - Secara default menggunakan API key live/env lebih dahulu daripada profil auth yang disimpan, sehingga key pengujian lama di `auth-profiles.json` tidak menutupi kredensial shell asli
  - Melewati provider yang tidak memiliki auth/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan jika tersedia:
    - `generate` dengan input prompt saja
    - `imageToVideo` saat provider mendeklarasikan `capabilities.imageToVideo.enabled` dan provider/model yang dipilih menerima input gambar lokal berbasis buffer dalam sweep bersama
    - `videoToVideo` saat provider mendeklarasikan `capabilities.videoToVideo.enabled` dan provider/model yang dipilih menerima input video lokal berbasis buffer dalam sweep bersama
  - Provider `imageToVideo` yang saat ini dideklarasikan tetapi di-skip dalam sweep bersama:
    - `vydra` karena `veo3` bawaan hanya mendukung teks dan `kling` bawaan memerlukan URL gambar jarak jauh
  - Cakupan Vydra spesifik provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - file itu menjalankan lane text-to-video `veo3` plus lane `kling` yang secara default menggunakan fixture URL gambar jarak jauh
  - Cakupan live `videoToVideo` saat ini:
    - `runway` hanya saat model yang dipilih adalah `runway/gen4_aleph`
  - Provider `videoToVideo` yang saat ini dideklarasikan tetapi di-skip dalam sweep bersama:
    - `alibaba`, `qwen`, `xai` karena path tersebut saat ini memerlukan URL referensi `http(s)` / MP4 jarak jauh
    - `google` karena lane Gemini/Veo bersama saat ini menggunakan input lokal berbasis buffer dan path itu tidak diterima dalam sweep bersama
    - `openai` karena lane bersama saat ini tidak memiliki jaminan akses video inpaint/remix spesifik org
- Penyempitan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth profile-store dan mengabaikan override khusus env

## Harness live media

- Perintah: `pnpm test:live:media`
- Tujuan:
  - Menjalankan suite live gambar, musik, dan video bersama melalui satu entrypoint native repo
  - Memuat otomatis env var provider yang hilang dari `~/.profile`
  - Secara default mempersempit otomatis setiap suite ke provider yang saat ini memiliki auth yang dapat digunakan
  - Menggunakan kembali `scripts/test-live.mjs`, sehingga perilaku heartbeat dan quiet-mode tetap konsisten
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker (opsional untuk pemeriksaan "berfungsi di Linux")

Runner Docker ini terbagi menjadi dua kelompok:

- Runner live-model: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file live profile-key yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan me-mount direktori config dan workspace lokal Anda (serta melakukan source `~/.profile` jika di-mount). Entrypoint lokal yang sesuai adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker secara default menggunakan batas smoke yang lebih kecil agar sweep Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override env var tersebut saat Anda
  memang ingin pemindaian lengkap yang lebih besar.
- `test:docker:all` membangun image live Docker sekali melalui `test:docker:live-build`, lalu menggunakannya kembali untuk dua lane live Docker tersebut.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels`, dan `test:docker:plugins` mem-boot satu atau lebih container nyata dan memverifikasi path integrasi tingkat lebih tinggi.

Runner Docker live-model juga me-mount hanya home auth CLI yang diperlukan (atau semua yang didukung saat eksekusi tidak dipersempit), lalu menyalinnya ke home container sebelum eksekusi agar OAuth CLI eksternal dapat menyegarkan token tanpa mengubah penyimpanan auth host:

- Model direct: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Jaringan gateway (dua container, auth + health WS): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Bridge channel MCP (Gateway seed + bridge stdio + smoke raw Claude notification-frame): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke instalasi + alias `/plugin` + semantik restart Claude-bundle): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)

Runner Docker live-model juga me-mount checkout saat ini sebagai read-only dan
men-stage-nya ke workdir sementara di dalam container. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap source/config lokal Anda secara persis.
Langkah staging melewati cache lokal besar dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta
direktori output `.build` lokal aplikasi atau Gradle sehingga Docker live run tidak
menghabiskan waktu beberapa menit untuk menyalin artefak spesifik mesin.
Runner ini juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` sehingga probe live gateway tidak memulai
worker channel Telegram/Discord/dll. nyata di dalam container.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan
live gateway dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: runner ini memulai
container gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai container Open WebUI yang dipatok terhadap gateway tersebut, melakukan sign in melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Eksekusi pertama bisa terasa lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan setup cold-start-nya sendiri.
Lane ini mengharapkan key model live yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam eksekusi berbasis Docker.
Eksekusi yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja dibuat deterministik dan tidak memerlukan
akun Telegram, Discord, atau iMessage nyata. Runner ini mem-boot Gateway seed
container, memulai container kedua yang memunculkan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata attachment,
perilaku antrean event live, routing pengiriman keluar, serta notifikasi channel +
izin bergaya Claude melalui bridge MCP stdio yang nyata. Pemeriksaan notifikasi
memeriksa frame MCP stdio mentah secara langsung sehingga smoke memvalidasi apa yang
sebenarnya dipancarkan bridge, bukan hanya apa yang kebetulan diekspos oleh SDK klien tertentu.

Smoke thread bahasa alami ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk alur kerja regresi/debug. Skrip ini mungkin diperlukan lagi untuk validasi routing thread ACP, jadi jangan dihapus.

Env var yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan di-source sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount sebagai read-only di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eksekusi provider yang dipersempit hanya me-mount direktori/file yang diperlukan yang diinferensikan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar dipisahkan koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit eksekusi
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider di dalam container
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari profile store (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk mengganti prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk mengganti tag image Open WebUI yang dipatok

## Pemeriksaan dokumentasi

Jalankan pemeriksaan dokumen setelah mengedit dokumen: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga memerlukan pemeriksaan heading di dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa provider nyata:

- Tool calling gateway (mock OpenAI, gateway + loop agent nyata): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard gateway (WS `wizard.start`/`wizard.next`, menulis config + auth dipaksakan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Evals keandalan agent (Skills)

Kami sudah memiliki beberapa pengujian aman untuk CI yang berperilaku seperti “evals keandalan agent”:

- Mock tool-calling melalui gateway + loop agent nyata (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring session dan efek config (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat Skills dicantumkan dalam prompt, apakah agent memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agent membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-giliran yang menegaskan urutan tool, carryover riwayat session, dan batas sandbox.

Evals di masa mendatang sebaiknya tetap deterministik terlebih dahulu:

- Runner skenario menggunakan provider mock untuk menegaskan pemanggilan tool + urutan, pembacaan file skill, dan wiring session.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, gating, prompt injection).
- Evals live opsional (opt-in, dibatasi env) hanya setelah suite aman untuk CI tersedia.

## Contract tests (bentuk plugin dan channel)

Contract tests memverifikasi bahwa setiap plugin dan channel yang terdaftar mematuhi
kontrak antarmukanya. Contract tests mengiterasi semua plugin yang ditemukan dan menjalankan
serangkaian asersi bentuk dan perilaku. Lane unit default `pnpm test` sengaja
melewati file seam bersama dan smoke ini; jalankan perintah contract secara eksplisit
saat Anda menyentuh surface channel atau provider bersama.

### Perintah

- Semua contract: `pnpm test:contracts`
- Hanya contract channel: `pnpm test:contracts:channels`
- Hanya contract provider: `pnpm test:contracts:plugins`

### Contract channel

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk plugin dasar (id, nama, kapabilitas)
- **setup** - Kontrak wizard setup
- **session-binding** - Perilaku pengikatan session
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler aksi channel
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Contract status provider

Terletak di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status channel
- **registry** - Bentuk registry plugin

### Contract provider

Terletak di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Penemuan plugin
- **loader** - Pemuatan plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/antarmuka plugin
- **wizard** - Wizard setup

### Kapan menjalankannya

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi channel atau plugin provider
- Setelah merefaktor registrasi atau penemuan plugin

Contract tests berjalan di CI dan tidak memerlukan API key nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah provider/model yang ditemukan secara live:

- Tambahkan regresi yang aman untuk CI jika memungkinkan (mock/stub provider, atau tangkap transformasi bentuk permintaan yang tepat)
- Jika secara inheren hanya bisa live (rate limit, kebijakan auth), pertahankan live test tetap sempit dan opt-in melalui env var
- Sebaiknya targetkan lapisan terkecil yang menangkap bug:
  - bug konversi/replay permintaan provider → direct models test
  - bug pipeline gateway session/history/tool → gateway live smoke atau pengujian mock gateway yang aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu menegaskan id exec traversal-segment ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam pengujian itu. Pengujian ini sengaja gagal pada id target yang tidak terklasifikasi sehingga kelas baru tidak bisa dilewati secara diam-diam.
