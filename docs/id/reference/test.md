---
read_when:
    - Menjalankan atau memperbaiki pengujian
summary: Cara menjalankan pengujian secara lokal (vitest) dan kapan menggunakan mode force/coverage
title: Pengujian
x-i18n:
    generated_at: "2026-04-07T09:19:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7c19390f7577b3a29796c67514c96fe4c86c9fa0c7686cd4e377c6e31dcd085
    source_path: reference/test.md
    workflow: 15
---

# Pengujian

- Kit pengujian lengkap (suite, live, Docker): [Testing](/id/help/testing)

- `pnpm test:force`: Menghentikan proses gateway yang masih tertinggal dan menahan port kontrol default, lalu menjalankan suite Vitest lengkap dengan port gateway terisolasi agar pengujian server tidak berbenturan dengan instance yang sedang berjalan. Gunakan ini ketika eksekusi gateway sebelumnya membuat port 18789 tetap terpakai.
- `pnpm test:coverage`: Menjalankan suite unit dengan cakupan V8 (melalui `vitest.unit.config.ts`). Ambang batas global adalah 70% untuk lines/branches/functions/statements. Cakupan mengecualikan entrypoint yang berat integrasi (wiring CLI, bridge gateway/telegram, server statis webchat) agar target tetap fokus pada logika yang bisa diuji dengan unit test.
- `pnpm test:coverage:changed`: Menjalankan cakupan unit hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:changed`: memperluas path git yang berubah menjadi lane Vitest terarah ketika diff hanya menyentuh file source/test yang dapat dirutekan. Perubahan config/setup tetap fallback ke root projects run native sehingga edit wiring tetap dijalankan ulang secara luas bila diperlukan.
- `pnpm test`: merutekan target file/direktori eksplisit melalui lane Vitest terarah. Eksekusi tanpa target sekarang menjalankan sebelas konfigurasi shard berurutan (`vitest.full-core-unit-src.config.ts`, `vitest.full-core-unit-security.config.ts`, `vitest.full-core-unit-ui.config.ts`, `vitest.full-core-unit-support.config.ts`, `vitest.full-core-support-boundary.config.ts`, `vitest.full-core-contracts.config.ts`, `vitest.full-core-bundled.config.ts`, `vitest.full-core-runtime.config.ts`, `vitest.full-agentic.config.ts`, `vitest.full-auto-reply.config.ts`, `vitest.full-extensions.config.ts`) alih-alih satu proses root-project besar.
- File pengujian `plugin-sdk` dan `commands` tertentu sekarang dirutekan melalui lane ringan khusus yang hanya mempertahankan `test/setup.ts`, sementara kasus yang berat pada runtime tetap berada di lane yang sudah ada.
- File source helper `plugin-sdk` dan `commands` tertentu juga memetakan `pnpm test:changed` ke pengujian sibling eksplisit di lane ringan tersebut, sehingga edit helper kecil tidak perlu menjalankan ulang suite berat yang didukung runtime.
- `auto-reply` sekarang juga dibagi menjadi tiga konfigurasi khusus (`core`, `top-level`, `reply`) sehingga harness reply tidak mendominasi pengujian status/token/helper top-level yang lebih ringan.
- Konfigurasi dasar Vitest sekarang default ke `pool: "threads"` dan `isolate: false`, dengan runner bersama non-isolated diaktifkan di seluruh konfigurasi repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` menjalankan `vitest.extensions.config.ts`.
- `pnpm test:extensions`: menjalankan suite extension/plugin.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi impor + rincian impor Vitest, sambil tetap menggunakan lane routing terarah untuk target file/direktori eksplisit.
- `pnpm test:perf:imports:changed`: profiling impor yang sama, tetapi hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` melakukan benchmark pada path changed-mode yang dirutekan terhadap root-project run native untuk diff git committed yang sama.
- `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark pada kumpulan perubahan worktree saat ini tanpa commit terlebih dahulu.
- `pnpm test:perf:profile:main`: menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis profil CPU + heap untuk unit runner (`.artifacts/vitest-runner-profile`).
- Integrasi gateway: opt-in melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan pengujian smoke end-to-end gateway (pairing multi-instance WS/HTTP/node). Default ke `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; sesuaikan dengan `OPENCLAW_E2E_WORKERS=<n>` dan atur `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan pengujian live provider (minimax/zai). Memerlukan kunci API dan `LIVE=1` (atau `*_LIVE_TEST=1` khusus provider) agar tidak di-skip.
- `pnpm test:docker:openwebui`: Memulai OpenClaw + Open WebUI dalam Docker, sign in melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat proxied nyata melalui `/api/chat/completions`. Memerlukan kunci model live yang dapat digunakan (misalnya OpenAI di `~/.profile`), menarik image Open WebUI eksternal, dan tidak diharapkan stabil di CI seperti suite unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Memulai container Gateway yang sudah di-seed dan container klien kedua yang menjalankan `openclaw mcp serve`, lalu memverifikasi discovery percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean event live, perutean pengiriman keluar, dan notifikasi channel + permission bergaya Claude melalui bridge stdio nyata. Assertion notifikasi Claude membaca frame MCP stdio mentah secara langsung sehingga smoke mencerminkan apa yang benar-benar dipancarkan bridge.

## Gate PR lokal

Untuk pemeriksaan land/gate PR secara lokal, jalankan:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` flaky di host yang sibuk, jalankan ulang sekali sebelum menganggapnya regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan keterbatasan memori, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark latensi model (kunci lokal)

Skrip: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt default: “Reply with a single word: ok. No punctuation or extra text.”

Eksekusi terakhir (2025-12-31, 20 eksekusi):

- minimax median 1279ms (min 1114, maks 2431)
- opus median 2454ms (min 1224, maks 3170)

## Benchmark startup CLI

Skrip: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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

Output mencakup `sampleCount`, avg, p50, p95, min/max, distribusi exit-code/signal, dan ringkasan RSS maksimum untuk setiap perintah. `--cpu-prof-dir` / `--heap-prof-dir` opsional menulis profil V8 per eksekusi sehingga penangkapan waktu dan profil menggunakan harness yang sama.

Konvensi output tersimpan:

- `pnpm test:startup:bench:smoke` menulis artefak smoke terarah di `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artefak suite lengkap di `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang di-check-in di `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang di-check-in:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini dengan fixture menggunakan `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk pengujian smoke onboarding dalam container.

Alur cold-start penuh dalam container Linux bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Skrip ini menggerakkan wizard interaktif melalui pseudo-tty, memverifikasi file config/workspace/session, lalu memulai gateway dan menjalankan `openclaw health`.

## Smoke impor QR (Docker)

Memastikan `qrcode-terminal` dimuat di runtime Node Docker yang didukung (default Node 24, kompatibel dengan Node 22):

```bash
pnpm test:docker:qr
```
