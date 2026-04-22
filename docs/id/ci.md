---
read_when:
    - Anda perlu memahami mengapa sebuah job CI berjalan atau tidak berjalan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
summary: Grafik job CI, gate cakupan, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-22T04:21:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae08bad6cbd0f2eced6c88a792a11bc1c2b1a2bfb003a56f70ff328a2739d3fc
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

CI berjalan pada setiap push ke `main` dan setiap pull request. CI menggunakan scoping cerdas untuk melewati job mahal saat hanya area yang tidak terkait yang berubah.

## Ikhtisar job

| Job                              | Tujuan                                                                                       | Kapan berjalan                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Mendeteksi perubahan docs-only, cakupan yang berubah, extension yang berubah, dan membangun manifes CI | Selalu pada push dan PR non-draft    |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                      | Selalu pada push dan PR non-draft    |
| `security-dependency-audit`      | Audit lockfile produksi tanpa dependensi terhadap advisory npm                               | Selalu pada push dan PR non-draft    |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                       | Selalu pada push dan PR non-draft    |
| `build-artifacts`                | Membangun `dist/` dan UI Control satu kali, mengunggah artifact yang dapat dipakai ulang untuk job hilir | Perubahan yang relevan dengan Node   |
| `checks-fast-core`               | Lane korektness Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol             | Perubahan yang relevan dengan Node   |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil       | Perubahan yang relevan dengan Node   |
| `checks-node-extensions`         | Shard pengujian Plugin bawaan penuh di seluruh suite extension                               | Perubahan yang relevan dengan Node   |
| `checks-node-core-test`          | Shard pengujian Node inti, tidak termasuk lane channel, bundled, contract, dan extension     | Perubahan yang relevan dengan Node   |
| `extension-fast`                 | Pengujian terfokus hanya untuk plugin bawaan yang berubah                                    | Saat perubahan extension terdeteksi  |
| `check`                          | Padanan gate lokal utama yang di-shard: prod types, lint, guard, test types, dan smoke ketat | Perubahan yang relevan dengan Node   |
| `check-additional`               | Guard arsitektur, boundary, extension-surface, package-boundary, dan shard gateway-watch     | Perubahan yang relevan dengan Node   |
| `build-smoke`                    | Smoke test CLI hasil build dan smoke memori startup                                          | Perubahan yang relevan dengan Node   |
| `checks`                         | Lane Linux Node yang tersisa: pengujian channel dan kompatibilitas Node 22 khusus push       | Perubahan yang relevan dengan Node   |
| `check-docs`                     | Pemeriksaan formatting, lint, dan broken-link docs                                           | Docs berubah                         |
| `skills-python`                  | Ruff + pytest untuk Skills berbasis Python                                                   | Perubahan yang relevan dengan skill Python |
| `checks-windows`                 | Lane pengujian khusus Windows                                                                | Perubahan yang relevan dengan Windows |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artifact hasil build bersama                     | Perubahan yang relevan dengan macOS  |
| `macos-swift`                    | Swift lint, build, dan test untuk aplikasi macOS                                             | Perubahan yang relevan dengan macOS  |
| `android`                        | Matriks build dan test Android                                                               | Perubahan yang relevan dengan Android |

## Urutan fail-fast

Job diurutkan agar pemeriksaan murah gagal sebelum job mahal berjalan:

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah step di dalam job ini, bukan job terpisah.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu job artifact dan matriks platform yang lebih berat.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat agar consumer hilir dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat kemudian menyebar: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`.
Workflow `install-smoke` yang terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Workflow ini menghitung `run_install_smoke` dari sinyal changed-smoke yang lebih sempit, sehingga smoke Docker/install hanya berjalan untuk perubahan yang relevan dengan install, packaging, dan container.

Logika lane-perubahan lokal berada di `scripts/changed-lanes.mjs` dan dijalankan oleh `scripts/check-changed.mjs`. Gate lokal tersebut lebih ketat terhadap boundary arsitektur dibanding cakupan platform CI yang luas: perubahan produksi inti menjalankan typecheck prod inti ditambah pengujian inti, perubahan test-only inti hanya menjalankan typecheck/test inti, perubahan produksi extension menjalankan typecheck prod extension ditambah pengujian extension, dan perubahan test-only extension hanya menjalankan typecheck/test extension. Perubahan public Plugin SDK atau plugin-contract diperluas ke validasi extension karena extension bergantung pada kontrak inti tersebut. Kenaikan versi metadata-only rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root yang terarah. Perubahan root/konfigurasi yang tidak diketahui gagal-aman ke semua lane.

Pada push, matriks `checks` menambahkan lane `compat-node22` yang khusus push. Pada pull request, lane tersebut dilewati dan matriks tetap fokus pada lane test/channel normal.

Keluarga pengujian Node yang paling lambat dibagi menjadi shard include-file agar setiap job tetap kecil: kontrak channel membagi cakupan registry dan core menjadi masing-masing delapan shard berbobot, pengujian perintah reply auto-reply dibagi menjadi empat shard include-pattern, dan grup prefix reply auto-reply besar lainnya dibagi menjadi masing-masing dua shard. `check-additional` juga memisahkan pekerjaan package-boundary compile/canary dari pekerjaan runtime topology gateway/architecture.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` saat push yang lebih baru masuk pada PR atau ref `main` yang sama. Perlakukan ini sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat secara eksplisit menyebut kasus pembatalan ini agar lebih mudah dibedakan dari kegagalan test.

## Runner

| Runner                           | Job                                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, pemeriksaan Linux, pemeriksaan docs, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` pada `openclaw/openclaw`; fork menggunakan fallback ke `macos-latest`                                                   |

## Padanan lokal

```bash
pnpm changed:lanes   # periksa classifier lane-perubahan lokal untuk origin/main...HEAD
pnpm check:changed   # gate lokal cerdas: typecheck/lint/test yang berubah per lane boundary
pnpm check          # gate lokal cepat: tsgo produksi + lint yang di-shard + fast guard paralel
pnpm check:test-types
pnpm check:timed    # gate yang sama dengan timing per tahap
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format + lint + broken links docs
pnpm build          # build dist saat lane artifact/build-smoke CI relevan
```
