---
read_when:
    - Anda perlu memahami mengapa sebuah pekerjaan CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
summary: Grafik pekerjaan CI, gerbang cakupan, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-22T09:14:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc7ec59123aee65634736320dbf1cf5cdfb08786a78cca82ce9596fedc68b3cc
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

CI berjalan pada setiap push ke `main` dan setiap pull request. CI menggunakan cakupan cerdas untuk melewati pekerjaan mahal ketika hanya area yang tidak terkait yang berubah.

## Ikhtisar Pekerjaan

| Pekerjaan                        | Tujuan                                                                                       | Kapan berjalan                     |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Mendeteksi perubahan khusus docs, cakupan yang berubah, extension yang berubah, dan membangun manifes CI | Selalu pada push dan PR non-draf   |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                      | Selalu pada push dan PR non-draf   |
| `security-dependency-audit`      | Audit lockfile produksi tanpa dependensi terhadap advisory npm                               | Selalu pada push dan PR non-draf   |
| `security-fast`                  | Agregat wajib untuk pekerjaan security cepat                                                 | Selalu pada push dan PR non-draf   |
| `build-artifacts`                | Membangun `dist/` dan UI Control satu kali, mengunggah artifact yang dapat digunakan ulang untuk pekerjaan turunan | Perubahan yang relevan dengan Node |
| `checks-fast-core`               | Lane korektness Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol             | Perubahan yang relevan dengan Node |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil       | Perubahan yang relevan dengan Node |
| `checks-node-extensions`         | Shard pengujian bundled-plugin penuh di seluruh suite extension                              | Perubahan yang relevan dengan Node |
| `checks-node-core-test`          | Shard pengujian core Node, tidak termasuk lane channel, bundled, contract, dan extension     | Perubahan yang relevan dengan Node |
| `extension-fast`                 | Pengujian terfokus hanya untuk bundled plugin yang berubah                                   | Saat perubahan extension terdeteksi |
| `check`                          | Padanan gerbang lokal utama yang di-shard: tipe prod, lint, guard, tipe uji, dan smoke ketat | Perubahan yang relevan dengan Node |
| `check-additional`               | Guard arsitektur, boundary, extension-surface, package-boundary, dan shard gateway-watch     | Perubahan yang relevan dengan Node |
| `build-smoke`                    | Pengujian smoke CLI hasil build dan smoke startup-memory                                     | Perubahan yang relevan dengan Node |
| `checks`                         | Lane Linux Node yang tersisa: pengujian channel dan kompatibilitas Node 22 khusus push       | Perubahan yang relevan dengan Node |
| `check-docs`                     | Pemeriksaan pemformatan, lint, dan tautan rusak docs                                         | Docs berubah                       |
| `skills-python`                  | Ruff + pytest untuk Skills berbasis Python                                                   | Perubahan yang relevan dengan skill Python |
| `checks-windows`                 | Lane pengujian khusus Windows                                                                | Perubahan yang relevan dengan Windows |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artifact hasil build bersama                     | Perubahan yang relevan dengan macOS |
| `macos-swift`                    | Lint, build, dan pengujian Swift untuk aplikasi macOS                                        | Perubahan yang relevan dengan macOS |
| `android`                        | Matriks build dan pengujian Android                                                          | Perubahan yang relevan dengan Android |

## Urutan Fail-Fast

Pekerjaan diurutkan agar pemeriksaan murah gagal lebih dulu sebelum pekerjaan mahal berjalan:

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam pekerjaan ini, bukan pekerjaan terpisah.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu pekerjaan artifact dan matriks platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat agar konsumen turunan dapat mulai segera setelah build bersama siap.
4. Setelah itu, lane platform dan runtime yang lebih berat menyebar: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`.
Workflow `install-smoke` yang terpisah menggunakan kembali skrip cakupan yang sama melalui pekerjaan `preflight` miliknya sendiri. Workflow ini menghitung `run_install_smoke` dari sinyal changed-smoke yang lebih sempit, sehingga smoke Docker/install hanya berjalan untuk perubahan yang relevan dengan install, packaging, dan container.

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dijalankan oleh `scripts/check-changed.mjs`. Gerbang lokal itu lebih ketat terhadap boundary arsitektur dibanding cakupan platform CI yang luas: perubahan produksi core menjalankan typecheck prod core plus pengujian core, perubahan khusus pengujian core hanya menjalankan typecheck/pengujian core test, perubahan produksi extension menjalankan typecheck prod extension plus pengujian extension, dan perubahan khusus pengujian extension hanya menjalankan typecheck/pengujian extension test. Perubahan pada Plugin SDK publik atau plugin-contract memperluas validasi ke extension karena extension bergantung pada kontrak core tersebut. Kenaikan versi khusus metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang ditargetkan. Perubahan root/konfigurasi yang tidak dikenal akan fail-safe ke semua lane.

Pada push, matriks `checks` menambahkan lane `compat-node22` khusus push. Pada pull request, lane itu dilewati dan matriks tetap berfokus pada lane test/channel normal.

Keluarga pengujian Node yang paling lambat dibagi menjadi shard include-file agar setiap pekerjaan tetap kecil: kontrak channel membagi cakupan registry dan core menjadi masing-masing delapan shard berbobot, pengujian perintah balasan auto-reply dibagi menjadi empat shard include-pattern, dan kelompok prefix balasan auto-reply besar lainnya dibagi menjadi masing-masing dua shard. `check-additional` juga memisahkan pekerjaan compile/canary package-boundary dari pekerjaan runtime topology gateway/architecture.

GitHub dapat menandai pekerjaan yang sudah digantikan sebagai `cancelled` ketika push yang lebih baru masuk pada PR atau ref `main` yang sama. Anggap itu sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat secara eksplisit menandai kasus pembatalan ini agar lebih mudah dibedakan dari kegagalan pengujian.

## Runner

| Runner                           | Pekerjaan                                                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`; preflight install-smoke juga menggunakan Ubuntu yang di-host GitHub agar matriks Blacksmith dapat antre lebih awal         |
| `blacksmith-16vcpu-ubuntu-2404`  | `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, pemeriksaan Linux, pemeriksaan docs, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` pada `openclaw/openclaw`; fork kembali menggunakan `macos-latest`                                          |

## Padanan Lokal

```bash
pnpm changed:lanes   # periksa classifier changed-lane lokal untuk origin/main...HEAD
pnpm check:changed   # gerbang lokal cerdas: typecheck/lint/pengujian yang berubah menurut boundary lane
pnpm check          # gerbang lokal cepat: tsgo produksi + lint yang di-shard + fast guard paralel
pnpm check:test-types
pnpm check:timed    # gerbang yang sama dengan timing per tahap
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # pengujian vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format docs + lint + tautan rusak
pnpm build          # bangun dist saat lane CI artifact/build-smoke relevan
```
