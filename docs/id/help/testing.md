---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan regresi untuk bug model/provider
    - Men-debug perilaku gateway + agen
summary: 'Kit pengujian: suite unit/e2e/live, runner Docker, dan cakupan masing-masing pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-04-10T09:13:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21b78e59a5189f4e8e6e1b490d350f4735c0395da31d21fc5d10b825313026b4
    source_path: help/testing.md
    workflow: 15
---

# Pengujian

OpenClaw memiliki tiga suite Vitest (unit/integrasi, e2e, live) dan sejumlah kecil runner Docker.

Dokumen ini adalah panduan “bagaimana kami menguji”:

- Apa yang dicakup setiap suite (dan apa yang sengaja _tidak_ dicakup)
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, sebelum push, debugging)
- Bagaimana pengujian live menemukan kredensial dan memilih model/provider
- Cara menambahkan regresi untuk masalah model/provider di dunia nyata

## Mulai cepat

Di sebagian besar hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm test`
- Menjalankan suite penuh lokal yang lebih cepat di mesin yang lega: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung sekarang juga merutekan path extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan menjalankan pengujian yang ditargetkan terlebih dahulu saat Anda sedang mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Lane QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau ingin keyakinan tambahan:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug provider/model nyata (memerlukan kredensial nyata):

- Suite live (probe model + gateway tool/image): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Tip: jika Anda hanya membutuhkan satu kasus yang gagal, persempit pengujian live melalui env var allowlist yang dijelaskan di bawah.

## Runner khusus QA

Perintah-perintah ini berada di samping suite pengujian utama saat Anda membutuhkan realisme QA-lab:

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di host.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` di host.
  - Menggunakan ulang flag pemilihan provider/model yang sama seperti `qa suite`.
  - Untuk run live, meneruskan input autentikasi QA yang didukung dan praktis untuk guest:
    kunci provider berbasis env, path konfigurasi provider live QA, dan `CODEX_HOME`
    bila ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis kembali melalui
    workspace yang di-mount.
  - Menulis laporan + ringkasan QA normal serta log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.

## Suite pengujian (apa yang berjalan di mana)

Bayangkan suite-suite ini sebagai “realisme yang meningkat” (dan flakiness/biaya yang meningkat):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Config: sepuluh run shard berurutan (`vitest.full-*.config.ts`) di atas project Vitest terlingkup yang sudah ada
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, dan pengujian node `ui` yang di-whitelist yang dicakup oleh `vitest.unit.config.ts`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi in-process (autentikasi gateway, routing, tooling, parsing, config)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan kunci nyata
  - Harus cepat dan stabil
- Catatan project:
  - `pnpm test` tanpa target sekarang menjalankan sebelas config shard yang lebih kecil (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses root-project native yang sangat besar. Ini mengurangi puncak RSS pada mesin yang sibuk dan mencegah pekerjaan auto-reply/extension membuat suite lain kelaparan sumber daya.
  - `pnpm test --watch` tetap menggunakan graf project root native `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
  - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane yang terlingkup terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tidak perlu membayar biaya startup penuh root project.
  - `pnpm test:changed` memperluas path git yang berubah ke lane terlingkup yang sama ketika diff hanya menyentuh file source/pengujian yang dapat dirutekan; edit config/setup tetap fallback ke rerun root-project yang luas.
  - Pengujian `plugin-sdk` dan `commands` tertentu juga dirutekan melalui lane ringan khusus yang melewati `test/setup-openclaw-runtime.ts`; file stateful/runtime-heavy tetap berada di lane yang ada.
  - File source helper `plugin-sdk` dan `commands` tertentu juga memetakan run mode changed ke pengujian sibling eksplisit di lane ringan itu, sehingga edit helper menghindari rerun seluruh suite berat untuk direktori tersebut.
  - `auto-reply` kini memiliki tiga bucket khusus: helper core level atas, pengujian integrasi `reply.*` level atas, dan subtree `src/auto-reply/reply/**`. Ini menjaga pekerjaan harness reply terberat tetap terpisah dari pengujian status/chunk/token yang murah.
- Catatan embedded runner:
  - Saat Anda mengubah input penemuan message-tool atau konteks runtime compaction,
    pertahankan kedua tingkat cakupan.
  - Tambahkan regresi helper yang terfokus untuk batas routing/normalisasi murni.
  - Juga pertahankan suite integrasi embedded runner tetap sehat:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Suite-suite tersebut memverifikasi bahwa id yang dicakup dan perilaku compaction tetap mengalir
    melalui path `run.ts` / `compact.ts` yang nyata; pengujian helper saja bukan
    pengganti yang memadai untuk path integrasi tersebut.
- Catatan pool:
  - Config dasar Vitest sekarang menggunakan `threads` secara default.
  - Config Vitest bersama juga menetapkan `isolate: false` dan menggunakan runner non-isolated di seluruh root project, config e2e, dan live.
  - Lane UI root mempertahankan setup dan optimizer `jsdom`, tetapi sekarang juga berjalan di runner non-isolated bersama.
  - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false` yang sama dari config Vitest bersama.
  - Launcher bersama `scripts/run-vitest.mjs` sekarang juga menambahkan `--no-maglev` untuk proses child Node Vitest secara default guna mengurangi churn kompilasi V8 selama run lokal besar. Tetapkan `OPENCLAW_VITEST_ENABLE_MAGLEV=1` jika Anda perlu membandingkan dengan perilaku V8 bawaan.
- Catatan iterasi lokal cepat:
  - `pnpm test:changed` merutekan melalui lane terlingkup ketika path yang berubah terpetakan dengan bersih ke suite yang lebih kecil.
  - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing yang sama, hanya dengan batas worker yang lebih tinggi.
  - Auto-scaling worker lokal kini memang sengaja lebih konservatif dan juga mengurangi skala ketika load average host sudah tinggi, sehingga beberapa run Vitest bersamaan secara default menimbulkan dampak yang lebih kecil.
  - Config dasar Vitest menandai file project/config sebagai `forceRerunTriggers` agar rerun mode changed tetap benar saat wiring pengujian berubah.
  - Config mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` tetap aktif pada host yang didukung; tetapkan `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda ingin satu lokasi cache eksplisit untuk profiling langsung.
- Catatan debug performa:
  - `pnpm test:perf:imports` mengaktifkan pelaporan durasi import Vitest beserta output rincian import.
  - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan `test:changed` yang dirutekan dengan path root-project native untuk diff yang di-commit itu dan mencetak wall time plus max RSS macOS.
- `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark pada tree kotor saat ini dengan merutekan daftar file yang berubah melalui `scripts/test-projects.mjs` dan config root Vitest.
  - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk overhead startup dan transform Vitest/Vite.
  - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk suite unit dengan paralelisme file dinonaktifkan.

### E2E (smoke gateway)

- Perintah: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Default runtime:
  - Menggunakan Vitest `threads` dengan `isolate: false`, selaras dengan bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Override yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksakan jumlah worker (dibatasi hingga 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Cakupan:
  - Perilaku end-to-end gateway multi-instance
  - Permukaan WebSocket/HTTP, pairing node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (saat diaktifkan dalam pipeline)
  - Tidak memerlukan kunci nyata
  - Lebih banyak bagian bergerak dibanding pengujian unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `test/openshell-sandbox.e2e.test.ts`
- Cakupan:
  - Memulai gateway OpenShell terisolasi di host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menjalankan backend OpenShell milik OpenClaw melalui `sandbox ssh-config` nyata + eksekusi SSH
  - Memverifikasi perilaku filesystem kanonis-remote melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari run default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal serta daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan gateway dan sandbox pengujian
- Override yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk mengarah ke binary CLI non-default atau wrapper script

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`
- Default: **aktif** oleh `pnpm test:live` (menetapkan `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format provider, keanehan tool-calling, masalah autentikasi, dan perilaku rate limit
- Ekspektasi:
  - Secara desain tidak stabil untuk CI (jaringan nyata, kebijakan provider nyata, kuota, gangguan)
  - Berbiaya / memakai rate limit
  - Lebih baik menjalankan subset yang dipersempit daripada “semuanya”
- Run live memuat `~/.profile` untuk mengambil API key yang belum ada.
- Secara default, run live tetap mengisolasi `HOME` dan menyalin materi config/auth ke home pengujian sementara agar fixture unit tidak dapat mengubah `~/.openclaw` Anda yang nyata.
- Tetapkan `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya ketika Anda memang sengaja memerlukan pengujian live menggunakan direktori home nyata Anda.
- `pnpm test:live` kini default ke mode yang lebih senyap: tetap mempertahankan output progres `[live] ...`, tetapi menekan notifikasi `~/.profile` tambahan dan membisukan log bootstrap gateway/chatter Bonjour. Tetapkan `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup lengkap kembali.
- Rotasi API key (khusus provider): tetapkan `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live via `OPENCLAW_LIVE_*_KEY`; pengujian akan mencoba ulang pada respons rate limit.
- Output progres/heartbeat:
  - Suite live kini mengirim baris progres ke stderr sehingga panggilan provider yang panjang terlihat aktif bahkan saat penangkapan konsol Vitest dalam mode senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest agar baris progres provider/gateway mengalir segera selama run live.
  - Atur heartbeat direct-model dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Atur heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug “bot saya down” / kegagalan khusus provider / tool calling: jalankan `pnpm test:live` yang dipersempit

## Live: sapuan kapabilitas node Android

- Pengujian: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: memanggil **setiap perintah yang saat ini diiklankan** oleh node Android yang terhubung dan memverifikasi perilaku kontrak perintah.
- Cakupan:
  - Setup manual/prasyarat (suite ini tidak menginstal/menjalankan/memasangkan aplikasi).
  - Validasi gateway `node.invoke` per perintah untuk node Android yang dipilih.
- Pra-setup yang diperlukan:
  - Aplikasi Android sudah terhubung + dipasangkan ke gateway.
  - Aplikasi tetap berada di foreground.
  - Izin/persetujuan capture diberikan untuk kapabilitas yang Anda harapkan lolos.
- Override target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail setup Android lengkap: [Android App](/id/platforms/android)

## Live: smoke model (kunci profil)

Pengujian live dibagi menjadi dua lapisan agar kami dapat mengisolasi kegagalan:

- “Model langsung” memberi tahu kita apakah provider/model dapat merespons sama sekali dengan kunci yang diberikan.
- “Smoke gateway” memberi tahu kita apakah pipeline gateway+agen penuh bekerja untuk model tersebut (sesi, riwayat, tools, kebijakan sandbox, dll.).

### Lapisan 1: Penyelesaian model langsung (tanpa gateway)

- Pengujian: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Mengenumerasi model yang ditemukan
  - Menggunakan `getApiKeyForModel` untuk memilih model yang Anda miliki kredensialnya
  - Menjalankan penyelesaian kecil per model (dan regresi tertarget bila diperlukan)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika menjalankan Vitest secara langsung)
- Tetapkan `OPENCLAW_LIVE_MODELS=modern` (atau `all`, alias untuk modern) agar suite ini benar-benar berjalan; jika tidak, suite ini dilewati agar `pnpm test:live` tetap berfokus pada smoke gateway
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` untuk menjalankan allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk allowlist modern
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist dipisahkan koma)
  - Sapuan modern/all secara default memakai batas kurasi dengan sinyal tinggi; tetapkan `OPENCLAW_LIVE_MAX_MODELS=0` untuk sapuan modern yang lengkap atau angka positif untuk batas yang lebih kecil.
- Cara memilih provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist dipisahkan koma)
- Dari mana kunci berasal:
  - Secara default: penyimpanan profil dan fallback env
  - Tetapkan `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk mewajibkan **penyimpanan profil** saja
- Mengapa ini ada:
  - Memisahkan “API provider rusak / kunci tidak valid” dari “pipeline agen gateway rusak”
  - Menampung regresi kecil yang terisolasi (contoh: replay reasoning OpenAI Responses/Codex Responses + alur tool-call)

### Lapisan 2: smoke gateway + agen dev (apa yang sebenarnya dilakukan "@openclaw")

- Pengujian: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Menyalakan gateway in-process
  - Membuat/menambal sesi `agent:dev:*` (override model per run)
  - Mengiterasi model-dengan-kunci dan memverifikasi:
    - respons yang “bermakna” (tanpa tools)
    - satu pemanggilan tool nyata berfungsi (probe read)
    - probe tool ekstra opsional (probe exec+read)
    - path regresi OpenAI (hanya tool-call → tindak lanjut) tetap berfungsi
- Detail probe (agar Anda bisa menjelaskan kegagalan dengan cepat):
  - probe `read`: pengujian menulis file nonce di workspace dan meminta agen untuk `read` file itu lalu mengembalikan nonce tersebut.
  - probe `exec+read`: pengujian meminta agen untuk menulis nonce ke file sementara melalui `exec`, lalu `read` kembali.
  - probe image: pengujian melampirkan PNG yang dihasilkan (kucing + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `src/gateway/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika menjalankan Vitest secara langsung)
- Cara memilih model:
  - Default: allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk allowlist modern
  - Atau tetapkan `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar dipisahkan koma) untuk mempersempit
  - Sapuan gateway modern/all secara default memakai batas kurasi dengan sinyal tinggi; tetapkan `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk sapuan modern yang lengkap atau angka positif untuk batas yang lebih kecil.
- Cara memilih provider (hindari “semua OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist dipisahkan koma)
- Probe tool + image selalu aktif dalam pengujian live ini:
  - probe `read` + probe `exec+read` (stress tool)
  - probe image berjalan saat model mengiklankan dukungan input image
  - Alur (tingkat tinggi):
    - Pengujian menghasilkan PNG kecil dengan “CAT” + kode acak (`src/gateway/live-image-probe.ts`)
    - Mengirimkannya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mem-parsing lampiran ke dalam `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agen embedded meneruskan pesan pengguna multimodal ke model
    - Verifikasi: balasan berisi `cat` + kode tersebut (toleransi OCR: kesalahan kecil diperbolehkan)

Tip: untuk melihat apa yang bisa Anda uji di mesin Anda (dan id `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backend CLI (Claude, Codex, Gemini, atau CLI lokal lainnya)

- Pengujian: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: memvalidasi pipeline Gateway + agen menggunakan backend CLI lokal, tanpa menyentuh config default Anda.
- Default smoke khusus backend berada di definisi `cli-backend.ts` milik extension pemiliknya.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika menjalankan Vitest secara langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Default:
  - Provider/model default: `claude-cli/claude-sonnet-4-6`
  - Perilaku perintah/arg/image berasal dari metadata plugin backend CLI pemiliknya.
- Override (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim lampiran image nyata (path disisipkan ke prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path file image sebagai arg CLI alih-alih menyisipkannya ke prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol cara arg image diteruskan saat `IMAGE_ARG` ditetapkan.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` untuk menonaktifkan probe kontinuitas sesi yang default dari Claude Sonnet -> Opus pada sesi yang sama (tetapkan ke `1` untuk memaksanya aktif saat model yang dipilih mendukung target switch).

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

Resep Docker single-provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Catatan:

- Runner Docker berada di `scripts/test-live-cli-backend-docker.sh`.
- Runner ini menjalankan smoke backend CLI live di dalam image Docker repo sebagai pengguna non-root `node`.
- Runner ini me-resolve metadata smoke CLI dari extension pemiliknya, lalu memasang paket CLI Linux yang sesuai (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) ke prefix writable yang di-cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (default: `~/.cache/openclaw/docker-cli-tools`).
- Smoke backend CLI live sekarang menjalankan alur end-to-end yang sama untuk Claude, Codex, dan Gemini: giliran teks, giliran klasifikasi image, lalu pemanggilan tool MCP `cron` yang diverifikasi melalui CLI gateway.
- Smoke default Claude juga menambal sesi dari Sonnet ke Opus dan memverifikasi bahwa sesi yang dilanjutkan masih mengingat catatan sebelumnya.

## Live: smoke bind ACP (`/acp spawn ... --bind here`)

- Pengujian: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur bind percakapan ACP nyata dengan agen ACP live:
  - kirim `/acp spawn <agent> --bind here`
  - bind percakapan saluran pesan sintetis di tempat
  - kirim tindak lanjut normal pada percakapan yang sama itu
  - verifikasi bahwa tindak lanjut masuk ke transkrip sesi ACP yang terikat
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Default:
  - Agen ACP di Docker: `claude,codex,gemini`
  - Agen ACP untuk `pnpm test:live ...` langsung: `claude`
  - Saluran sintetis: konteks percakapan gaya DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Catatan:
  - Lane ini menggunakan permukaan gateway `chat.send` dengan field originating-route sintetis khusus admin sehingga pengujian dapat melampirkan konteks saluran pesan tanpa berpura-pura mengirim secara eksternal.
  - Saat `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak ditetapkan, pengujian menggunakan registry agen bawaan plugin `acpx` embedded untuk agen harness ACP yang dipilih.

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

Resep Docker single-agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-acp-bind-docker.sh`.
- Secara default, runner ini menjalankan smoke bind ACP terhadap semua agen CLI live yang didukung secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` untuk mempersempit matriks.
- Runner ini memuat `~/.profile`, menyiapkan materi autentikasi CLI yang sesuai ke dalam container, memasang `acpx` ke prefix npm writable, lalu memasang CLI live yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) jika belum ada.
- Di dalam Docker, runner menetapkan `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` agar acpx tetap menyediakan env var provider dari profile yang dimuat untuk CLI harness child.

### Resep live yang direkomendasikan

Allowlist yang sempit dan eksplisit adalah yang tercepat dan paling tidak flaky:

- Satu model, langsung (tanpa gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Satu model, smoke gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling di beberapa provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus Google (API key Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Catatan:

- `google/...` menggunakan Gemini API (API key).
- `google-antigravity/...` menggunakan bridge OAuth Antigravity (endpoint agen bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan Gemini CLI lokal di mesin Anda (autentikasi + keanehan tooling terpisah).
- Gemini API vs Gemini CLI:
  - API: OpenClaw memanggil Gemini API yang di-host Google melalui HTTP (API key / autentikasi profil); inilah yang dimaksud sebagian besar pengguna saat menyebut “Gemini”.
  - CLI: OpenClaw melakukan shell out ke binary `gemini` lokal; ini memiliki autentikasi sendiri dan dapat berperilaku berbeda (streaming/dukungan tool/perbedaan versi).

## Live: matriks model (apa yang kami cakup)

Tidak ada “daftar model CI” yang tetap (live bersifat opt-in), tetapi ini adalah model-model yang **direkomendasikan** untuk dicakup secara rutin di mesin pengembang dengan kunci.

### Set smoke modern (tool calling + image)

Ini adalah run “model umum” yang kami harapkan tetap berfungsi:

- OpenAI (non-Codex): `openai/gpt-5.4` (opsional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` dan `google/gemini-3-flash-preview` (hindari model Gemini 2.x yang lebih lama)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` dan `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Jalankan smoke gateway dengan tools + image:
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
- Mistral: `mistral/`… (pilih satu model yang mampu menangani “tools” dan telah Anda aktifkan)
- Cerebras: `cerebras/`… (jika Anda memiliki akses)
- LM Studio: `lmstudio/`… (lokal; tool calling bergantung pada mode API)

### Vision: pengiriman image (lampiran → pesan multimodal)

Sertakan setidaknya satu model yang mendukung image dalam `OPENCLAW_LIVE_GATEWAY_MODELS` (varian Claude/Gemini/OpenAI yang mendukung vision, dll.) untuk menjalankan probe image.

### Aggregator / gateway alternatif

Jika Anda mengaktifkan kunci, kami juga mendukung pengujian melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat yang mendukung tool+image)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (autentikasi melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Lebih banyak provider yang dapat Anda sertakan dalam matriks live (jika Anda memiliki kredensial/config):

- Built-in: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoint kustom): `minimax` (cloud/API), ditambah proxy yang kompatibel dengan OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, dll.)

Tip: jangan mencoba melakukan hardcode “semua model” di dokumen. Daftar otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` di mesin Anda + kunci apa pun yang tersedia.

## Kredensial (jangan pernah commit)

Pengujian live menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktisnya:

- Jika CLI berfungsi, pengujian live seharusnya menemukan kunci yang sama.
- Jika pengujian live mengatakan “tidak ada kredensial”, debug dengan cara yang sama seperti Anda men-debug `openclaw models list` / pemilihan model.

- Profil autentikasi per agen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah yang dimaksud “kunci profil” dalam pengujian live)
- Config: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori state lama: `~/.openclaw/credentials/` (disalin ke home live yang dipersiapkan saat ada, tetapi bukan penyimpanan utama kunci profil)
- Run live lokal menyalin config aktif, file `auth-profiles.json` per agen, `credentials/` lama, dan direktori autentikasi CLI eksternal yang didukung ke home pengujian sementara secara default; home live yang dipersiapkan melewati `workspace/` dan `sandboxes/`, dan override path `agents.*.workspace` / `agentDir` dihapus agar probe tidak menyentuh workspace host nyata Anda.

Jika Anda ingin mengandalkan kunci env (misalnya diekspor di `~/.profile` Anda), jalankan pengujian lokal setelah `source ~/.profile`, atau gunakan runner Docker di bawah (runner tersebut dapat me-mount `~/.profile` ke dalam container).

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
  - Melewati tiap kapabilitas kecuali `models.providers.comfy.<capability>` telah dikonfigurasi
  - Berguna setelah mengubah pengiriman workflow comfy, polling, unduhan, atau registrasi plugin

## Live pembuatan image

- Pengujian: `src/image-generation/runtime.live.test.ts`
- Perintah: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Mengenumerasi setiap plugin provider pembuatan image yang terdaftar
  - Memuat env var provider yang belum ada dari login shell Anda (`~/.profile`) sebelum probing
  - Secara default menggunakan API key live/env lebih dahulu daripada profil autentikasi yang tersimpan, agar kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell nyata
  - Melewati provider yang tidak memiliki autentikasi/profil/model yang dapat digunakan
  - Menjalankan varian stock pembuatan image melalui kapabilitas runtime bersama:
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
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi dari penyimpanan profil dan mengabaikan override yang hanya berasal dari env

## Live pembuatan musik

- Pengujian: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menjalankan path provider pembuatan musik bawaan bersama
  - Saat ini mencakup Google dan MiniMax
  - Memuat env var provider dari login shell Anda (`~/.profile`) sebelum probing
  - Secara default menggunakan API key live/env lebih dahulu daripada profil autentikasi yang tersimpan, agar kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell nyata
  - Melewati provider yang tidak memiliki autentikasi/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan saat tersedia:
    - `generate` dengan input hanya prompt
    - `edit` saat provider mendeklarasikan `capabilities.edit.enabled`
  - Cakupan shared-lane saat ini:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy terpisah, bukan sapuan bersama ini
- Penyempitan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi dari penyimpanan profil dan mengabaikan override yang hanya berasal dari env

## Live pembuatan video

- Pengujian: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menjalankan path provider pembuatan video bawaan bersama
  - Memuat env var provider dari login shell Anda (`~/.profile`) sebelum probing
  - Secara default menggunakan API key live/env lebih dahulu daripada profil autentikasi yang tersimpan, agar kunci pengujian usang di `auth-profiles.json` tidak menutupi kredensial shell nyata
  - Melewati provider yang tidak memiliki autentikasi/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan saat tersedia:
    - `generate` dengan input hanya prompt
    - `imageToVideo` saat provider mendeklarasikan `capabilities.imageToVideo.enabled` dan provider/model yang dipilih menerima input image lokal berbasis buffer dalam sapuan bersama
    - `videoToVideo` saat provider mendeklarasikan `capabilities.videoToVideo.enabled` dan provider/model yang dipilih menerima input video lokal berbasis buffer dalam sapuan bersama
  - Provider `imageToVideo` yang saat ini dideklarasikan tetapi dilewati dalam sapuan bersama:
    - `vydra` karena `veo3` bawaan hanya mendukung teks dan `kling` bawaan memerlukan URL image jarak jauh
  - Cakupan Vydra khusus provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - file tersebut menjalankan `veo3` text-to-video serta lane `kling` yang secara default menggunakan fixture URL image jarak jauh
  - Cakupan live `videoToVideo` saat ini:
    - `runway` hanya saat model yang dipilih adalah `runway/gen4_aleph`
  - Provider `videoToVideo` yang saat ini dideklarasikan tetapi dilewati dalam sapuan bersama:
    - `alibaba`, `qwen`, `xai` karena path tersebut saat ini memerlukan URL referensi `http(s)` / MP4 jarak jauh
    - `google` karena lane Gemini/Veo bersama saat ini menggunakan input lokal berbasis buffer dan path itu tidak diterima dalam sapuan bersama
    - `openai` karena lane bersama saat ini tidak memiliki jaminan akses video inpaint/remix spesifik organisasi
- Penyempitan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Perilaku autentikasi opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa autentikasi dari penyimpanan profil dan mengabaikan override yang hanya berasal dari env

## Harness live media

- Perintah: `pnpm test:live:media`
- Tujuan:
  - Menjalankan suite live image, music, dan video bersama melalui entrypoint native repo tunggal
  - Memuat otomatis env var provider yang belum ada dari `~/.profile`
  - Secara default mempersempit otomatis tiap suite ke provider yang saat ini memiliki autentikasi yang dapat digunakan
  - Menggunakan ulang `scripts/test-live.mjs`, sehingga perilaku heartbeat dan mode senyap tetap konsisten
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker (opsional untuk pemeriksaan "berfungsi di Linux")

Runner Docker ini terbagi ke dalam dua kelompok:

- Runner live-model: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file live kunci-profil yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan me-mount direktori config dan workspace lokal Anda (serta memuat `~/.profile` jika di-mount). Entrypoint lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker secara default memakai batas smoke yang lebih kecil agar sapuan Docker penuh tetap praktis:
  `test:docker:live-models` secara default menetapkan `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` secara default menetapkan `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override env var tersebut saat Anda
  memang ingin pemindaian lengkap yang lebih besar.
- `test:docker:all` membangun image Docker live satu kali melalui `test:docker:live-build`, lalu menggunakannya kembali untuk dua lane Docker live tersebut.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels`, dan `test:docker:plugins` menyalakan satu atau lebih container nyata dan memverifikasi path integrasi tingkat lebih tinggi.

Runner Docker live-model juga melakukan bind-mount hanya pada home autentikasi CLI yang diperlukan (atau semuanya yang didukung saat run tidak dipersempit), lalu menyalinnya ke home container sebelum run agar OAuth CLI eksternal dapat menyegarkan token tanpa mengubah penyimpanan autentikasi host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Jaringan gateway (dua container, autentikasi WS + health): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Bridge channel MCP (Gateway berisi seed + bridge stdio + smoke notification-frame Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin (smoke install + alias `/plugin` + semantik restart bundle Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)

Runner Docker live-model juga melakukan bind-mount checkout saat ini dalam mode read-only dan
menyiapkannya ke workdir sementara di dalam container. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap source/config lokal Anda yang tepat.
Langkah staging melewati cache besar yang hanya lokal dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, dan direktori output `.build` lokal aplikasi atau
Gradle sehingga run live Docker tidak menghabiskan waktu beberapa menit untuk menyalin
artefak spesifik mesin.
Runner tersebut juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` agar probe live gateway tidak memulai
worker channel Telegram/Discord/dll. nyata di dalam container.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan live
gateway dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: runner ini memulai
container gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai container Open WebUI yang dipin terhadap gateway itu, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Run pertama bisa terasa lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan setup cold-start miliknya.
Lane ini mengharapkan kunci model live yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run yang di-Docker-kan.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja dibuat deterministik dan tidak memerlukan
akun Telegram, Discord, atau iMessage nyata. Runner ini menyalakan container Gateway
yang sudah diberi seed, memulai container kedua yang menjalankan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean event live, routing pengiriman keluar, serta notifikasi saluran +
izin bergaya Claude melalui bridge MCP stdio nyata. Pemeriksaan notifikasi
menginspeksi frame MCP stdio mentah secara langsung sehingga smoke ini memvalidasi apa yang
benar-benar dipancarkan oleh bridge, bukan hanya apa yang kebetulan ditampilkan oleh SDK klien tertentu.

Smoke thread bahasa natural ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Simpan skrip ini untuk alur kerja regresi/debug. Ini mungkin akan dibutuhkan lagi untuk validasi routing thread ACP, jadi jangan dihapus.

Env var yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan dimuat sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI cache di dalam Docker
- Direktori/file autentikasi CLI eksternal di bawah `$HOME` di-mount sebagai read-only di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run provider yang dipersempit hanya me-mount direktori/file yang diperlukan yang diinferensikan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar dipisahkan koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider di dalam container
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk mengoverride prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk mengoverride tag image Open WebUI yang dipin

## Pemeriksaan kewarasan docs

Jalankan pemeriksaan docs setelah mengedit docs: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga memerlukan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa provider nyata:

- Tool calling gateway (mock OpenAI, gateway nyata + loop agen): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard gateway (WS `wizard.start`/`wizard.next`, menulis config + auth dipaksakan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Eval reliabilitas agen (Skills)

Kami sudah memiliki beberapa pengujian aman-CI yang berperilaku seperti “eval reliabilitas agen”:

- Mock tool-calling melalui gateway nyata + loop agen (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring sesi dan efek config (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat Skills dicantumkan dalam prompt, apakah agen memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/arg yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-giliran yang memverifikasi urutan tool, pembawaan riwayat sesi, dan batas sandbox.

Eval di masa mendatang sebaiknya tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan mock provider untuk memverifikasi pemanggilan tool + urutannya, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, gating, injeksi prompt).
- Eval live opsional (opt-in, dibatasi env) hanya setelah suite aman-CI tersedia.

## Pengujian kontrak (bentuk plugin dan channel)

Pengujian kontrak memverifikasi bahwa setiap plugin dan channel yang terdaftar sesuai dengan
kontrak interface-nya. Pengujian ini mengiterasi semua plugin yang ditemukan dan menjalankan rangkaian
verifikasi bentuk dan perilaku. Lane unit default `pnpm test` sengaja
melewati file seam bersama dan smoke ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh permukaan channel atau provider bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak channel: `pnpm test:contracts:channels`
- Hanya kontrak provider: `pnpm test:contracts:plugins`

### Kontrak channel

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk plugin dasar (id, nama, kapabilitas)
- **setup** - Kontrak wizard setup
- **session-binding** - Perilaku pengikatan sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler aksi channel
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status provider

Terletak di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status channel
- **registry** - Bentuk registry plugin

### Kontrak provider

Terletak di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur autentikasi
- **auth-choice** - Pilihan/seleksi autentikasi
- **catalog** - API katalog model
- **discovery** - Penemuan plugin
- **loader** - Pemuatan plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/interface plugin
- **wizard** - Wizard setup

### Kapan dijalankan

- Setelah mengubah export atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi plugin channel atau provider
- Setelah melakukan refaktor registrasi atau penemuan plugin

Pengujian kontrak berjalan di CI dan tidak memerlukan API key nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah provider/model yang ditemukan dalam live:

- Tambahkan regresi aman-CI jika memungkinkan (mock/stub provider, atau tangkap transformasi bentuk permintaan yang tepat)
- Jika sifatnya memang hanya live (rate limit, kebijakan autentikasi), buat pengujian live tetap sempit dan opt-in melalui env var
- Utamakan menargetkan lapisan terkecil yang menangkap bug:
  - bug konversi/replay permintaan provider → pengujian model langsung
  - bug pipeline sesi/riwayat/tool gateway → smoke live gateway atau pengujian mock gateway yang aman-CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target contoh per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu memverifikasi id exec segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam pengujian tersebut. Pengujian ini sengaja gagal pada id target yang tidak terklasifikasi agar kelas baru tidak dapat dilewati secara diam-diam.
