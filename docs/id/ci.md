---
read_when:
    - Anda perlu memahami mengapa suatu job CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
summary: Grafik job CI, scope gate, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-23T09:17:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89c66204b203a39435cfc19de7b437867f2792bbfa2c3948371abde9f80e11
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

CI berjalan pada setiap push ke `main` dan setiap pull request. CI menggunakan scope cerdas untuk melewati job mahal saat hanya area yang tidak terkait yang berubah.

QA Lab memiliki lane CI khusus di luar workflow utama yang memakai scope cerdas. Workflow
`Parity gate` berjalan pada perubahan PR yang cocok dan manual dispatch; workflow ini
membangun runtime QA privat dan membandingkan pack agentic mock GPT-5.4 dan Opus 4.6.
Workflow `QA-Lab - All Lanes` berjalan setiap malam di `main` dan pada
manual dispatch; workflow ini memecah mock parity gate, lane Matrix live, dan lane
Telegram live menjadi job paralel. Job live menggunakan environment `qa-live-shared`,
dan lane Telegram menggunakan lease Convex. `OpenClaw Release
Checks` juga menjalankan lane QA Lab yang sama sebelum persetujuan rilis.

## Ringkasan Job

| Job                              | Tujuan                                                                                       | Kapan berjalan                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Mendeteksi perubahan docs-only, scope yang berubah, extension yang berubah, dan membangun manifest CI | Selalu pada push dan PR non-draft    |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                      | Selalu pada push dan PR non-draft    |
| `security-dependency-audit`      | Audit lockfile produksi tanpa dependensi terhadap advisory npm                               | Selalu pada push dan PR non-draft    |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                       | Selalu pada push dan PR non-draft    |
| `build-artifacts`                | Membangun `dist/`, UI Control, pemeriksaan built-artifact, dan artifact downstream yang dapat digunakan kembali | Perubahan yang relevan dengan Node   |
| `checks-fast-core`               | Lane korektness Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol             | Perubahan yang relevan dengan Node   |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil       | Perubahan yang relevan dengan Node   |
| `checks-node-extensions`         | Shard pengujian penuh plugin bawaan di seluruh suite extension                               | Perubahan yang relevan dengan Node   |
| `checks-node-core-test`          | Shard pengujian core Node, tidak termasuk lane channel, bundled, kontrak, dan extension      | Perubahan yang relevan dengan Node   |
| `extension-fast`                 | Pengujian terfokus hanya untuk plugin bawaan yang berubah                                    | Pull request dengan perubahan extension |
| `check`                          | Padanan local gate utama yang di-shard: prod types, lint, guard, test types, dan smoke ketat | Perubahan yang relevan dengan Node   |
| `check-additional`               | Guard arsitektur, boundary, extension-surface, package-boundary, dan shard gateway-watch     | Perubahan yang relevan dengan Node   |
| `build-smoke`                    | Pengujian smoke CLI hasil build dan smoke memori saat startup                                | Perubahan yang relevan dengan Node   |
| `checks`                         | Verifier untuk pengujian channel built-artifact plus kompatibilitas Node 22 khusus push      | Perubahan yang relevan dengan Node   |
| `check-docs`                     | Pemformatan docs, lint, dan pemeriksaan broken-link                                          | Docs berubah                         |
| `skills-python`                  | Ruff + pytest untuk Skills berbasis Python                                                   | Perubahan yang relevan dengan Python skill |
| `checks-windows`                 | Lane pengujian khusus Windows                                                                | Perubahan yang relevan dengan Windows |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan built artifact bersama                           | Perubahan yang relevan dengan macOS  |
| `macos-swift`                    | Lint, build, dan pengujian Swift untuk aplikasi macOS                                        | Perubahan yang relevan dengan macOS  |
| `android`                        | Pengujian unit Android untuk kedua flavor plus satu build APK debug                          | Perubahan yang relevan dengan Android |

## Urutan Fail-Fast

Job diurutkan agar pemeriksaan murah gagal sebelum job yang mahal berjalan:

1. `preflight` memutuskan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job terpisah.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job artifact dan matriks platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat agar konsumen downstream dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat lalu berjalan paralel setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` khusus PR, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

Logika scope berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`.
Edit workflow CI memvalidasi grafik CI Node plus lint workflow, tetapi tidak dengan sendirinya memaksa build native Windows, Android, atau macOS; lane platform tersebut tetap dibatasi pada perubahan source platform.
Pemeriksaan Node Windows dibatasi pada wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan surface workflow CI yang menjalankan lane tersebut; perubahan source, plugin, install-smoke, dan test-only yang tidak terkait tetap berada di lane Linux Node agar tidak memesan worker Windows 16-vCPU untuk cakupan yang sudah dijalankan oleh shard test normal.
Workflow `install-smoke` yang terpisah menggunakan ulang skrip scope yang sama melalui job `preflight` miliknya sendiri. Workflow ini menghitung `run_install_smoke` dari sinyal changed-smoke yang lebih sempit, sehingga smoke Docker/install berjalan untuk perubahan terkait install, packaging, container, perubahan produksi bundled extension, dan surface core plugin/channel/Gateway/Plugin SDK yang diuji oleh job smoke Docker. Edit test-only dan docs-only tidak memesan worker Docker. Smoke paket QR memaksa layer Docker `pnpm install` dijalankan ulang sambil mempertahankan cache BuildKit pnpm store, sehingga tetap menguji instalasi tanpa mengunduh ulang dependensi pada setiap run. Gateway-network e2e menggunakan ulang image runtime yang dibangun sebelumnya dalam job tersebut, sehingga menambahkan cakupan WebSocket container-ke-container yang nyata tanpa menambahkan build Docker lain. `test:docker:all` lokal membangun lebih dahulu satu image built-app bersama dari `scripts/e2e/Dockerfile` dan menggunakannya kembali di runner smoke container E2E; workflow live/E2E yang dapat digunakan ulang meniru pola itu dengan membangun dan mendorong satu image E2E Docker GHCR bertag SHA sebelum matriks Docker, lalu menjalankan matriks dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Pengujian Docker QR dan installer mempertahankan Dockerfile mereka sendiri yang berfokus pada instalasi. Job `docker-e2e-fast` yang terpisah menjalankan profil Docker bundled-plugin terbatas di bawah timeout perintah 120 detik: perbaikan dependensi setup-entry plus isolasi kegagalan bundled-loader sintetis. Matriks update/channel bundled penuh tetap manual/full-suite karena melakukan update npm nyata berulang dan doctor repair pass.

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dijalankan oleh `scripts/check-changed.mjs`. Local gate itu lebih ketat soal boundary arsitektur dibanding scope platform CI yang luas: perubahan produksi core menjalankan typecheck prod core plus pengujian core, perubahan hanya pada pengujian core hanya menjalankan typecheck/pengujian core test, perubahan produksi extension menjalankan typecheck prod extension plus pengujian extension, dan perubahan hanya pada pengujian extension hanya menjalankan typecheck/pengujian extension test. Perubahan public Plugin SDK atau plugin-contract diperluas ke validasi extension karena extension bergantung pada kontrak core tersebut. Version bump yang hanya metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang terarah. Perubahan root/konfigurasi yang tidak dikenal fail safe ke semua lane.

Pada push, matriks `checks` menambahkan lane `compat-node22` khusus push. Pada pull request, lane itu dilewati dan matriks tetap berfokus pada lane pengujian/channel normal.

Keluarga pengujian Node paling lambat dipecah atau diseimbangkan agar setiap job tetap kecil: kontrak channel membagi cakupan registry dan core menjadi total enam shard berbobot, pengujian plugin bawaan diseimbangkan di enam worker extension, auto-reply berjalan sebagai tiga worker seimbang alih-alih enam worker kecil, dan konfigurasi agentic Gateway/plugin disebar ke job Node agentic source-only yang sudah ada alih-alih menunggu built artifact. Pengujian browser, QA, media, dan plugin miscellanous yang luas menggunakan konfigurasi Vitest khusus mereka alih-alih catch-all plugin bersama. Lane agents yang luas menggunakan scheduler file-parallel Vitest bersama karena didominasi import/penjadwalan, bukan dimiliki oleh satu file test lambat. `runtime-config` berjalan dengan shard core-runtime infra agar shard runtime bersama tidak menjadi ekor. `check-additional` menyatukan pekerjaan compile/canary package-boundary dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard boundary guard menjalankan guard kecil independennya secara paralel di dalam satu job. Gateway watch, pengujian channel, dan shard core support-boundary berjalan paralel di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun, mempertahankan nama check lama mereka sebagai job verifier ringan sambil menghindari dua worker Blacksmith tambahan dan antrean konsumen artifact kedua.
Android CI menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor third-party tidak memiliki source set atau manifest terpisah; lane unit-test-nya tetap mengompilasi flavor itu dengan flag BuildConfig SMS/call-log, sambil menghindari job packaging APK debug duplikat pada setiap push yang relevan dengan Android.
`extension-fast` khusus PR karena push run sudah menjalankan shard plugin bawaan penuh. Ini menjaga umpan balik plugin yang berubah untuk review tanpa memesan worker Blacksmith tambahan di `main` untuk cakupan yang sudah ada di `checks-node-extensions`.

GitHub dapat menandai job yang digantikan sebagai `cancelled` ketika push yang lebih baru masuk pada PR atau ref `main` yang sama. Perlakukan itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan agregat shard menggunakan `!cancelled() && always()` sehingga tetap melaporkan kegagalan shard normal tetapi tidak masuk antrean setelah seluruh workflow sudah digantikan.
Kunci konkurensi CI diberi versi (`CI-v7-*`) sehingga zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run main yang lebih baru tanpa batas.

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job keamanan cepat dan agregatnya (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan cepat protocol/contract/bundled, pemeriksaan kontrak channel yang di-shard, shard `check` kecuali lint, shard dan agregat `check-additional`, verifier agregat test Node, pemeriksaan docs, Python Skills, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard test Linux Node, shard test plugin bawaan, `android`                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, yang tetap cukup sensitif terhadap CPU sehingga 8 vCPU justru lebih mahal daripada penghematannya; build Docker install-smoke, tempat biaya waktu antrean 32-vCPU lebih besar daripada penghematannya                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` di `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` di `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |

## Padanan Lokal

```bash
pnpm changed:lanes   # periksa classifier changed-lane lokal untuk origin/main...HEAD
pnpm check:changed   # local gate cerdas: typecheck/lint/test yang berubah berdasarkan boundary lane
pnpm check          # local gate cepat: tsgo produksi + lint yang di-shard + fast guard paralel
pnpm check:test-types
pnpm check:timed    # gate yang sama dengan timing per tahap
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # pengujian vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format docs + lint + broken link
pnpm build          # build dist saat lane artifact/build-smoke CI relevan
node scripts/ci-run-timings.mjs <run-id>  # rangkum wall time, waktu antrean, dan job paling lambat
```
