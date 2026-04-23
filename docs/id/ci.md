---
read_when:
    - Anda perlu memahami mengapa sebuah pekerjaan CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
summary: Grafik pekerjaan CI, gerbang cakupan, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-23T14:55:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

CI berjalan pada setiap push ke `main` dan setiap pull request. CI menggunakan cakupan cerdas untuk melewati pekerjaan mahal ketika hanya area yang tidak terkait yang berubah.

QA Lab memiliki lane CI khusus di luar workflow utama dengan cakupan cerdas. Workflow
`Parity gate` berjalan pada perubahan PR yang cocok dan manual dispatch; workflow ini
membangun runtime QA privat dan membandingkan paket agentic tiruan GPT-5.4 dan Opus 4.6.
Workflow `QA-Lab - All Lanes` berjalan setiap malam di `main` dan pada
manual dispatch; workflow ini menyebarkan mock parity gate, lane Matrix live, dan lane
Telegram live sebagai pekerjaan paralel. Pekerjaan live menggunakan environment `qa-live-shared`,
dan lane Telegram menggunakan lease Convex. `OpenClaw Release
Checks` juga menjalankan lane QA Lab yang sama sebelum persetujuan rilis.

## Ringkasan Pekerjaan

| Job                              | Tujuan                                                                                       | Kapan dijalankan                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, cakupan yang berubah, ekstensi yang berubah, dan membangun manifes CI | Selalu pada push dan PR non-draf    |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                      | Selalu pada push dan PR non-draf    |
| `security-dependency-audit`      | Audit lockfile produksi tanpa dependensi terhadap advisory npm                               | Selalu pada push dan PR non-draf    |
| `security-fast`                  | Agregat wajib untuk pekerjaan keamanan cepat                                                 | Selalu pada push dan PR non-draf    |
| `build-artifacts`                | Membangun `dist/`, UI Control, pemeriksaan built-artifact, dan artifact downstream yang dapat digunakan ulang | Perubahan yang relevan dengan Node  |
| `checks-fast-core`               | Lane korektness Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol             | Perubahan yang relevan dengan Node  |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil       | Perubahan yang relevan dengan Node  |
| `checks-node-extensions`         | Shard pengujian bundled-plugin penuh di seluruh suite ekstensi                               | Perubahan yang relevan dengan Node  |
| `checks-node-core-test`          | Shard pengujian Node inti, tidak termasuk lane channel, bundled, contract, dan extension     | Perubahan yang relevan dengan Node  |
| `extension-fast`                 | Pengujian terfokus hanya untuk plugin bundled yang berubah                                   | Pull request dengan perubahan ekstensi |
| `check`                          | Padanan gerbang lokal utama yang di-shard: tipe prod, lint, guard, tipe pengujian, dan smoke ketat | Perubahan yang relevan dengan Node  |
| `check-additional`               | Guard arsitektur, boundary, extension-surface, package-boundary, dan shard gateway-watch     | Perubahan yang relevan dengan Node  |
| `build-smoke`                    | Pengujian smoke CLI yang sudah dibangun dan smoke memori startup                             | Perubahan yang relevan dengan Node  |
| `checks`                         | Verifikator untuk pengujian channel built-artifact ditambah kompatibilitas Node 22 khusus push | Perubahan yang relevan dengan Node  |
| `check-docs`                     | Pemeriksaan pemformatan docs, lint, dan tautan rusak                                         | Docs berubah                        |
| `skills-python`                  | Ruff + pytest untuk Skills berbasis Python                                                   | Perubahan yang relevan dengan Skills Python |
| `checks-windows`                 | Lane pengujian khusus Windows                                                                | Perubahan yang relevan dengan Windows |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan built artifact bersama                           | Perubahan yang relevan dengan macOS |
| `macos-swift`                    | Lint, build, dan pengujian Swift untuk aplikasi macOS                                        | Perubahan yang relevan dengan macOS |
| `android`                        | Pengujian unit Android untuk kedua flavor ditambah satu build APK debug                      | Perubahan yang relevan dengan Android |

## Urutan Gagal-Cepat

Pekerjaan diurutkan agar pemeriksaan murah gagal sebelum pekerjaan mahal berjalan:

1. `preflight` menentukan lane mana saja yang ada. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam pekerjaan ini, bukan pekerjaan terpisah.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu pekerjaan artifact dan matriks platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat agar konsumen downstream dapat mulai segera setelah build bersama siap.
4. Setelah itu lane platform dan runtime yang lebih berat menyebar: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` khusus PR, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`.
Edit workflow CI memvalidasi grafik CI Node plus workflow linting, tetapi tidak dengan sendirinya memaksa build native Windows, Android, atau macOS; lane platform tersebut tetap dibatasi pada perubahan sumber platform.
Pemeriksaan Node Windows dibatasi pada wrapper proses/path khusus Windows, helper runner npm/pnpm/UI, konfigurasi package manager, dan permukaan workflow CI yang menjalankan lane tersebut; perubahan source, plugin, install-smoke, dan khusus test yang tidak terkait tetap berada di lane Linux Node agar tidak memesan worker Windows 16-vCPU untuk cakupan yang sudah diuji oleh shard test normal.
Workflow `install-smoke` yang terpisah menggunakan ulang skrip cakupan yang sama melalui pekerjaan `preflight` miliknya sendiri. Workflow ini menghitung `run_install_smoke` dari sinyal changed-smoke yang lebih sempit, sehingga smoke Docker/install berjalan untuk perubahan yang relevan dengan instalasi, packaging, container, perubahan produksi bundled extension, dan permukaan inti plugin/channel/Gateway/Plugin SDK yang diuji oleh pekerjaan smoke Docker. Edit khusus test dan docs tidak memesan worker Docker. Smoke paket QR-nya memaksa layer Docker `pnpm install` untuk dijalankan ulang sambil mempertahankan cache BuildKit pnpm store, sehingga tetap menguji instalasi tanpa mengunduh ulang dependensi pada setiap run. E2E gateway-network-nya menggunakan ulang image runtime yang dibangun sebelumnya di dalam pekerjaan, sehingga menambah cakupan WebSocket container-ke-container nyata tanpa menambah build Docker lain. Agregat lokal `test:docker:all` melakukan prebuild satu image live-test bersama dan satu image built-app `scripts/e2e/Dockerfile` bersama, lalu menjalankan lane smoke live/E2E secara paralel dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`; sesuaikan konkurensi bawaan 4 dengan `OPENCLAW_DOCKER_ALL_PARALLELISM`. Agregat lokal secara bawaan berhenti menjadwalkan lane pool baru setelah kegagalan pertama, dan setiap lane memiliki timeout 120 menit yang dapat dioverride dengan `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Lane yang sensitif terhadap startup atau provider berjalan secara eksklusif setelah pool paralel. Workflow live/E2E yang dapat digunakan ulang mencerminkan pola shared-image dengan membangun dan mendorong satu image Docker E2E GHCR bertag SHA sebelum matriks Docker, lalu menjalankan matriks dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`. Workflow live/E2E terjadwal menjalankan suite Docker jalur rilis penuh setiap hari. Pengujian Docker QR dan installer mempertahankan Dockerfile fokus-instalasi mereka sendiri. Pekerjaan `docker-e2e-fast` yang terpisah menjalankan profil Docker bundled-plugin yang dibatasi dengan command timeout 120 detik: perbaikan dependensi setup-entry ditambah isolasi kegagalan bundled-loader sintetis. Matriks update/channel bundled penuh tetap manual/full-suite karena melakukan pass update npm nyata dan perbaikan doctor berulang.

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dijalankan oleh `scripts/check-changed.mjs`. Gerbang lokal itu lebih ketat terhadap boundary arsitektur dibanding cakupan platform CI yang luas: perubahan produksi inti menjalankan typecheck prod inti ditambah pengujian inti, perubahan khusus test inti hanya menjalankan typecheck/pengujian test inti, perubahan produksi ekstensi menjalankan typecheck prod ekstensi ditambah pengujian ekstensi, dan perubahan khusus test ekstensi hanya menjalankan typecheck/pengujian test ekstensi. Perubahan Plugin SDK publik atau plugin-contract diperluas ke validasi ekstensi karena ekstensi bergantung pada kontrak inti tersebut. Kenaikan versi khusus metadata rilis menjalankan pemeriksaan terarah untuk versi/konfigurasi/dependensi root. Perubahan root/konfigurasi yang tidak diketahui gagal-aman ke semua lane.

Pada push, matriks `checks` menambahkan lane `compat-node22` khusus push. Pada pull request, lane itu dilewati dan matriks tetap berfokus pada lane test/channel normal.

Keluarga pengujian Node yang paling lambat dipisah atau diseimbangkan agar setiap pekerjaan tetap kecil tanpa memesan runner secara berlebihan: kontrak channel berjalan sebagai tiga shard berbobot, pengujian bundled plugin diseimbangkan di enam worker ekstensi, lane unit inti kecil dipasangkan, auto-reply berjalan sebagai tiga worker seimbang alih-alih enam worker kecil, dan konfigurasi agentic gateway/plugin disebarkan ke pekerjaan agentic Node khusus source yang sudah ada alih-alih menunggu built artifact. Pengujian browser luas, QA, media, dan plugin lain-lain menggunakan konfigurasi Vitest khusus mereka alih-alih catch-all plugin bersama. Lane agents yang luas menggunakan scheduler paralel-berkas Vitest bersama karena didominasi import/penjadwalan, bukan dimiliki oleh satu file test lambat. `runtime-config` berjalan bersama shard infra core-runtime agar shard runtime bersama tidak menanggung ekor. `check-additional` menjaga pekerjaan compile/canary package-boundary tetap bersama dan memisahkan arsitektur topologi runtime dari cakupan gateway watch; shard boundary guard menjalankan guard independen kecilnya secara bersamaan di dalam satu pekerjaan. Gateway watch, pengujian channel, dan shard boundary dukungan inti berjalan bersamaan di dalam `build-artifacts` setelah `dist/` dan `dist-runtime/` sudah dibangun, mempertahankan nama pemeriksaan lama mereka sebagai pekerjaan verifikator ringan sambil menghindari dua worker Blacksmith tambahan dan antrean konsumen artifact kedua.
Android CI menjalankan `testPlayDebugUnitTest` dan `testThirdPartyDebugUnitTest`, lalu membangun APK debug Play. Flavor third-party tidak memiliki source set atau manifes terpisah; lane unit-test-nya tetap mengompilasi flavor tersebut dengan flag BuildConfig SMS/call-log, sambil menghindari pekerjaan packaging APK debug duplikat pada setiap push yang relevan dengan Android.
`extension-fast` khusus PR karena run push sudah menjalankan shard plugin bundled penuh. Ini mempertahankan umpan balik changed-plugin untuk review tanpa memesan worker Blacksmith tambahan di `main` untuk cakupan yang sudah ada di `checks-node-extensions`.

GitHub dapat menandai pekerjaan yang digantikan sebagai `cancelled` ketika push yang lebih baru masuk pada PR atau ref `main` yang sama. Anggap itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat menggunakan `!cancelled() && always()` agar tetap melaporkan kegagalan shard normal tetapi tidak antre setelah seluruh workflow sudah digantikan.
Kunci konkurensi CI diberi versi (`CI-v7-*`) agar zombie sisi GitHub dalam grup antrean lama tidak dapat memblokir run `main` yang lebih baru tanpa batas waktu.

## Runner

| Runner                           | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, pekerjaan keamanan cepat dan agregat (`security-scm-fast`, `security-dependency-audit`, `security-fast`), pemeriksaan protocol/contract/bundled cepat, pemeriksaan kontrak channel yang di-shard, shard `check` kecuali lint, shard dan agregat `check-additional`, verifikator agregat pengujian Node, pemeriksaan docs, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat mengantre lebih awal |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard pengujian Linux Node, shard pengujian bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, yang tetap cukup sensitif terhadap CPU sehingga 8 vCPU justru lebih mahal daripada penghematannya; build Docker install-smoke, di mana waktu antre 32-vCPU lebih mahal daripada penghematannya                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` pada `openclaw/openclaw`; fork fallback ke `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |

## Padanan Lokal

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local gate: changed typecheck/lint/tests by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
```
