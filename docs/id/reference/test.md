---
read_when:
    - Menjalankan atau memperbaiki pengujian
summary: Cara menjalankan pengujian secara lokal (vitest) dan kapan menggunakan mode force/coverage
title: Pengujian
x-i18n:
    generated_at: "2026-04-25T13:56:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- Kit pengujian lengkap (suite, live, Docker): [Pengujian](/id/help/testing)

- `pnpm test:force`: Menghentikan proses Gateway yang masih tertinggal dan menahan port kontrol default, lalu menjalankan suite Vitest penuh dengan port Gateway terisolasi agar pengujian server tidak berbenturan dengan instance yang sedang berjalan. Gunakan ini saat proses Gateway sebelumnya meninggalkan port 18789 dalam keadaan terpakai.
- `pnpm test:coverage`: Menjalankan suite unit dengan cakupan V8 (melalui `vitest.unit.config.ts`). Ini adalah gerbang cakupan unit untuk file yang dimuat, bukan cakupan semua file di seluruh repo. Ambang batasnya adalah 70% lines/functions/statements dan 55% branches. Karena `coverage.all` bernilai false, gerbang ini mengukur file yang dimuat oleh suite cakupan unit alih-alih menganggap setiap file sumber split-lane sebagai tidak tercakup.
- `pnpm test:coverage:changed`: Menjalankan cakupan unit hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:changed`: memperluas path git yang berubah menjadi lane Vitest terlingkup saat diff hanya menyentuh file sumber/pengujian yang dapat dirutekan. Perubahan config/setup tetap menggunakan fallback ke root projects native agar pengeditan wiring dijalankan ulang secara luas bila diperlukan.
- `pnpm changed:lanes`: menampilkan lane arsitektural yang dipicu oleh diff terhadap `origin/main`.
- `pnpm check:changed`: menjalankan gerbang perubahan cerdas untuk diff terhadap `origin/main`. Ini menjalankan pekerjaan inti dengan lane pengujian inti, pekerjaan extension dengan lane pengujian extension, pekerjaan khusus pengujian dengan hanya typecheck/pengujian pengujian, memperluas perubahan Plugin SDK publik atau plugin-contract ke satu lintasan validasi extension, dan menjaga kenaikan versi yang hanya menyentuh metadata rilis tetap pada pemeriksaan versi/config/dependensi root yang terarah.
- `pnpm test`: merutekan target file/direktori eksplisit melalui lane Vitest terlingkup. Eksekusi tanpa target menggunakan kelompok shard tetap dan diperluas ke konfigurasi leaf untuk eksekusi paralel lokal; kelompok extension selalu diperluas ke konfigurasi shard per-extension alih-alih satu proses root-project raksasa.
- Eksekusi shard penuh dan extension memperbarui data waktu lokal di `.artifacts/vitest-shard-timings.json`; eksekusi berikutnya menggunakan waktu tersebut untuk menyeimbangkan shard lambat dan cepat. Atur `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artefak waktu lokal.
- File pengujian `plugin-sdk` dan `commands` tertentu sekarang dirutekan melalui lane ringan khusus yang hanya mempertahankan `test/setup.ts`, dan membiarkan kasus berat runtime tetap di lane yang sudah ada.
- File sumber helper `plugin-sdk` dan `commands` tertentu juga memetakan `pnpm test:changed` ke pengujian sibling eksplisit di lane ringan tersebut, sehingga pengeditan helper kecil tidak menjalankan ulang suite berat yang didukung runtime.
- `auto-reply` sekarang juga dibagi menjadi tiga config khusus (`core`, `top-level`, `reply`) sehingga harness balasan tidak mendominasi pengujian status/token/helper tingkat atas yang lebih ringan.
- Config dasar Vitest sekarang menggunakan default `pool: "threads"` dan `isolate: false`, dengan runner bersama non-terisolasi diaktifkan di seluruh config repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard extension/plugin. Plugin channel berat, plugin browser, dan OpenAI dijalankan sebagai shard khusus; kelompok plugin lain tetap dibatch. Gunakan `pnpm test extensions/<id>` untuk satu lane plugin bawaan.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi impor + rincian impor Vitest, sambil tetap menggunakan perutean lane terlingkup untuk target file/direktori eksplisit.
- `pnpm test:perf:imports:changed`: profiling impor yang sama, tetapi hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mengukur performa path mode changed yang dirutekan terhadap eksekusi root-project native untuk diff git ter-commit yang sama.
- `pnpm test:perf:changed:bench -- --worktree` mengukur performa set perubahan worktree saat ini tanpa melakukan commit terlebih dahulu.
- `pnpm test:perf:profile:main`: menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis profil CPU + heap untuk runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: menjalankan setiap config leaf Vitest full-suite secara serial dan menulis data durasi berkelompok beserta artefak JSON/log per-config. Agen Performa Pengujian menggunakan ini sebagai baseline sebelum mencoba perbaikan pengujian lambat.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: membandingkan laporan berkelompok setelah perubahan yang berfokus pada performa.
- Integrasi Gateway: opt-in melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan pengujian smoke end-to-end Gateway (pairing WS/HTTP/node multi-instance). Default menggunakan `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>` dan atur `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan pengujian live provider (minimax/zai). Memerlukan API key dan `LIVE=1` (atau `*_LIVE_TEST=1` khusus provider) agar tidak di-skip.
- `pnpm test:docker:all`: Membangun image live-test bersama dan image Docker E2E sekali, lalu menjalankan lane smoke Docker dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` melalui scheduler berbobot. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` mengontrol slot proses dan defaultnya 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` mengontrol pool tail sensitif-provider dan defaultnya 10. Batas lane berat secara default adalah `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; batas provider secara default satu lane berat per provider melalui `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, dan `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Gunakan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` untuk host yang lebih besar. Mulai lane di-stagger 2 detik secara default untuk menghindari lonjakan create pada daemon Docker lokal; override dengan `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner melakukan preflight Docker secara default, membersihkan container E2E OpenClaw basi, mengeluarkan status lane aktif setiap 30 detik, berbagi cache tool CLI provider antar lane yang kompatibel, mencoba ulang kegagalan provider live yang sementara satu kali secara default (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), dan menyimpan waktu lane di `.artifacts/docker-tests/lane-timings.json` untuk pengurutan yang terlama terlebih dahulu pada eksekusi berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes lane tanpa menjalankan Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` untuk menyesuaikan output status, atau `OPENCLAW_DOCKER_ALL_TIMINGS=0` untuk menonaktifkan penggunaan ulang waktu. Gunakan `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` untuk lane deterministik/lokal saja atau `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` untuk lane provider live saja; alias package adalah `pnpm test:docker:local:all` dan `pnpm test:docker:live:all`. Mode live-only menggabungkan lane live utama dan tail menjadi satu pool terlama-terlebih-dahulu sehingga bucket provider dapat mengemas pekerjaan Claude, Codex, dan Gemini bersama. Runner berhenti menjadwalkan lane pool baru setelah kegagalan pertama kecuali `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` diatur, dan setiap lane memiliki fallback timeout 120 menit yang dapat dioverride dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; lane live/tail tertentu menggunakan batas per-lane yang lebih ketat. Perintah setup Docker backend CLI memiliki timeout tersendiri melalui `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (default 180). Log per-lane ditulis di bawah `.artifacts/docker-tests/<run-id>/`.
- Probe Docker live backend CLI dapat dijalankan sebagai lane terfokus, misalnya `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, atau `pnpm test:docker:live-cli-backend:codex:mcp`. Claude dan Gemini memiliki alias `:resume` dan `:mcp` yang setara.
- `pnpm test:docker:openwebui`: Memulai OpenClaw + Open WebUI dalam Docker, masuk melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat proksi nyata melalui `/api/chat/completions`. Memerlukan live model key yang dapat digunakan (misalnya OpenAI di `~/.profile`), menarik image Open WebUI eksternal, dan tidak diharapkan stabil di CI seperti suite unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Memulai container Gateway yang sudah di-seed dan container klien kedua yang menjalankan `openclaw mcp serve`, lalu memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean event live, perutean pengiriman outbound, serta notifikasi channel + izin bergaya Claude melalui jembatan stdio nyata. Asersi notifikasi Claude membaca frame MCP stdio mentah secara langsung sehingga smoke mencerminkan apa yang benar-benar dipancarkan oleh jembatan.

## Gerbang PR lokal

Untuk pemeriksaan gerbang/land PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` mengalami flake pada host yang sibuk, jalankan ulang sekali sebelum menganggapnya sebagai regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan memori terbatas, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Bench latensi model (kunci lokal)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt default: “Balas dengan satu kata: ok. Tanpa tanda baca atau teks tambahan.”

Eksekusi terakhir (2025-12-31, 20 kali):

- median minimax 1279ms (min 1114, maks 2431)
- median opus 2454ms (min 1224, maks 3170)

## Bench startup CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Penggunaan:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: kedua preset

Output mencakup `sampleCount`, avg, p50, p95, min/max, distribusi exit-code/signal, dan ringkasan RSS maksimum untuk setiap perintah. `--cpu-prof-dir` / `--heap-prof-dir` opsional menulis profil V8 per eksekusi sehingga pengukuran waktu dan pengambilan profil menggunakan harness yang sama.

Konvensi output tersimpan:

- `pnpm test:startup:bench:smoke` menulis artefak smoke terarah di `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artefak full-suite di `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang di-check-in di `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang di-check-in:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini terhadap fixture dengan `pnpm test:startup:bench:check`

## E2E onboarding (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk pengujian smoke onboarding yang dikontainerisasi.

Alur cold-start penuh dalam container Linux bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Script ini menggerakkan wizard interaktif melalui pseudo-tty, memverifikasi file config/workspace/session, lalu memulai Gateway dan menjalankan `openclaw health`.

## Pengujian smoke impor QR (Docker)

Memastikan helper runtime QR yang dipelihara dimuat di bawah runtime Node Docker yang didukung (Node 24 default, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```

## Terkait

- [Pengujian](/id/help/testing)
- [Pengujian live](/id/help/testing-live)
