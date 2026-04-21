---
read_when:
    - Menjalankan atau memperbaiki test
summary: Cara menjalankan test secara lokal (vitest) dan kapan menggunakan mode force/coverage
title: Test
x-i18n:
    generated_at: "2026-04-21T09:23:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# Test

- Paket pengujian lengkap (suite, live, Docker): [Testing](/id/help/testing)

- `pnpm test:force`: Mematikan proses gateway yang masih tersisa dan memegang port control default, lalu menjalankan seluruh suite Vitest dengan port gateway terisolasi agar test server tidak bertabrakan dengan instance yang sedang berjalan. Gunakan ini saat proses gateway sebelumnya meninggalkan port 18789 dalam keadaan terpakai.
- `pnpm test:coverage`: Menjalankan suite unit dengan coverage V8 (melalui `vitest.unit.config.ts`). Ini adalah gerbang coverage unit untuk file yang dimuat, bukan coverage semua file seluruh repo. Threshold-nya adalah 70% lines/functions/statements dan 55% branches. Karena `coverage.all` bernilai false, gerbang ini mengukur file yang dimuat oleh suite coverage unit alih-alih menganggap setiap file sumber split-lane sebagai tidak tercakup.
- `pnpm test:coverage:changed`: Menjalankan coverage unit hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:changed`: memperluas path git yang berubah menjadi lane Vitest bercakupan ketika diff hanya menyentuh file source/test yang dapat dirutekan. Perubahan config/setup tetap fallback ke root projects native agar edit wiring dijalankan ulang secara luas saat diperlukan.
- `pnpm changed:lanes`: menampilkan lane arsitektural yang dipicu oleh diff terhadap `origin/main`.
- `pnpm check:changed`: menjalankan gerbang changed cerdas untuk diff terhadap `origin/main`. Ini menjalankan pekerjaan inti dengan lane test inti, pekerjaan extension dengan lane test extension, pekerjaan khusus test hanya dengan typecheck/test test, dan memperluas perubahan Plugin SDK publik atau plugin-contract ke validasi extension.
- `pnpm test`: merutekan target file/direktori eksplisit melalui lane Vitest bercakupan. Run tanpa target menggunakan grup shard tetap dan diperluas ke leaf config untuk eksekusi paralel lokal; grup extension selalu diperluas ke config shard per-extension alih-alih satu proses root-project raksasa.
- Run shard penuh dan extension memperbarui data timing lokal di `.artifacts/vitest-shard-timings.json`; run berikutnya menggunakan timing tersebut untuk menyeimbangkan shard lambat dan cepat. Set `OPENCLAW_TEST_PROJECTS_TIMINGS=0` untuk mengabaikan artifact timing lokal.
- File test `plugin-sdk` dan `commands` tertentu kini dirutekan melalui lane ringan khusus yang hanya mempertahankan `test/setup.ts`, sementara kasus berat runtime tetap berada di lane lama masing-masing.
- File source helper `plugin-sdk` dan `commands` tertentu juga memetakan `pnpm test:changed` ke test sibling eksplisit di lane ringan tersebut, sehingga edit helper kecil tidak memicu ulang suite berat yang didukung runtime.
- `auto-reply` kini juga dibagi menjadi tiga config khusus (`core`, `top-level`, `reply`) sehingga harness balasan tidak mendominasi test helper/status/token top-level yang lebih ringan.
- Config Vitest dasar kini default ke `pool: "threads"` dan `isolate: false`, dengan runner bersama non-terisolasi diaktifkan di seluruh config repo.
- `pnpm test:channels` menjalankan `vitest.channels.config.ts`.
- `pnpm test:extensions` dan `pnpm test extensions` menjalankan semua shard extension/plugin. Extension channel berat dan OpenAI berjalan sebagai shard khusus; grup extension lain tetap dibatch. Gunakan `pnpm test extensions/<id>` untuk satu lane plugin bawaan.
- `pnpm test:perf:imports`: mengaktifkan pelaporan durasi impor + rincian impor Vitest, sambil tetap menggunakan perutean lane bercakupan untuk target file/direktori eksplisit.
- `pnpm test:perf:imports:changed`: profiling impor yang sama, tetapi hanya untuk file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membenchmark jalur mode changed yang dirutekan terhadap run root-project native untuk diff git ter-commit yang sama.
- `pnpm test:perf:changed:bench -- --worktree` membenchmark set perubahan worktree saat ini tanpa harus commit terlebih dahulu.
- `pnpm test:perf:profile:main`: menulis profil CPU untuk thread utama Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: menulis profil CPU + heap untuk runner unit (`.artifacts/vitest-runner-profile`).
- Integrasi Gateway: ikut serta melalui `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` atau `pnpm test:gateway`.
- `pnpm test:e2e`: Menjalankan test smoke end-to-end gateway (pairing WS/HTTP/node multi-instance). Default ke `threads` + `isolate: false` dengan worker adaptif di `vitest.e2e.config.ts`; atur dengan `OPENCLAW_E2E_WORKERS=<n>` dan set `OPENCLAW_E2E_VERBOSE=1` untuk log verbose.
- `pnpm test:live`: Menjalankan test live provider (minimax/zai). Memerlukan API key dan `LIVE=1` (atau `*_LIVE_TEST=1` khusus provider) agar tidak dilewati.
- `pnpm test:docker:openwebui`: Memulai OpenClaw + Open WebUI berbasis Docker, masuk melalui Open WebUI, memeriksa `/api/models`, lalu menjalankan chat terproxy nyata melalui `/api/chat/completions`. Memerlukan key model live yang dapat digunakan (misalnya OpenAI di `~/.profile`), menarik image Open WebUI eksternal, dan tidak diharapkan stabil di CI seperti suite unit/e2e normal.
- `pnpm test:docker:mcp-channels`: Memulai container Gateway yang sudah di-seed dan container klien kedua yang menjalankan `openclaw mcp serve`, lalu memverifikasi discovery percakapan yang dirutekan, pembacaan transkrip, metadata lampiran, perilaku antrean event live, routing kirim outbound, dan notifikasi channel + izin gaya Claude melalui bridge stdio nyata. Asersi notifikasi Claude membaca frame MCP stdio mentah secara langsung sehingga smoke benar-benar mencerminkan apa yang dipancarkan bridge.

## Gerbang PR lokal

Untuk pemeriksaan gerbang/land PR lokal, jalankan:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Jika `pnpm test` flake pada host yang sibuk, jalankan ulang sekali sebelum menganggapnya regresi, lalu isolasi dengan `pnpm test <path/to/test>`. Untuk host dengan memori terbatas, gunakan:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark latensi model (key lokal)

Skrip: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Penggunaan:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env opsional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt default: “Reply with a single word: ok. No punctuation or extra text.”

Run terakhir (2025-12-31, 20 run):

- median minimax 1279ms (min 1114, maks 2431)
- median opus 2454ms (min 1224, maks 3170)

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

Output mencakup `sampleCount`, avg, p50, p95, min/max, distribusi exit-code/signal, dan ringkasan RSS maksimum untuk setiap perintah. `--cpu-prof-dir` / `--heap-prof-dir` opsional menulis profil V8 per run sehingga pengambilan timing dan profil menggunakan harness yang sama.

Konvensi output tersimpan:

- `pnpm test:startup:bench:smoke` menulis artifact smoke yang ditargetkan ke `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` menulis artifact full-suite ke `.artifacts/cli-startup-bench-all.json` menggunakan `runs=5` dan `warmup=1`
- `pnpm test:startup:bench:update` menyegarkan fixture baseline yang di-check-in di `test/fixtures/cli-startup-bench.json` menggunakan `runs=5` dan `warmup=1`

Fixture yang di-check-in:

- `test/fixtures/cli-startup-bench.json`
- Segarkan dengan `pnpm test:startup:bench:update`
- Bandingkan hasil saat ini terhadap fixture dengan `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker bersifat opsional; ini hanya diperlukan untuk test smoke onboarding berbasis container.

Alur cold-start penuh di container Linux bersih:

```bash
scripts/e2e/onboard-docker.sh
```

Skrip ini menggerakkan wizard interaktif melalui pseudo-tty, memverifikasi file config/workspace/session, lalu memulai gateway dan menjalankan `openclaw health`.

## Smoke impor QR (Docker)

Memastikan `qrcode-terminal` termuat di runtime Node Docker yang didukung (Node 24 default, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```
