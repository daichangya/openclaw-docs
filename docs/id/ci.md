---
read_when:
    - Anda perlu memahami mengapa suatu job CI dijalankan atau tidak dijalankan
    - Anda sedang men-debug pemeriksaan GitHub Actions yang gagal
summary: Grafik job CI, gerbang cakupan, dan padanan perintah lokal
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-21T09:16:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

CI berjalan pada setiap push ke `main` dan setiap pull request. CI menggunakan cakupan cerdas untuk melewati job mahal ketika hanya area yang tidak terkait yang berubah.

## Ringkasan job

| Job                              | Tujuan                                                                                               | Kapan dijalankan                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Mendeteksi perubahan khusus docs, cakupan yang berubah, extension yang berubah, dan membangun manifes CI | Selalu pada push dan PR non-draf     |
| `security-scm-fast`              | Deteksi private key dan audit workflow melalui `zizmor`                                              | Selalu pada push dan PR non-draf     |
| `security-dependency-audit`      | Audit lockfile produksi tanpa dependensi terhadap advisory npm                                       | Selalu pada push dan PR non-draf     |
| `security-fast`                  | Agregat wajib untuk job keamanan cepat                                                               | Selalu pada push dan PR non-draf     |
| `build-artifacts`                | Membangun `dist/` dan UI Control sekali, mengunggah artifact yang dapat digunakan ulang untuk job hilir | Perubahan yang relevan dengan Node   |
| `checks-fast-core`               | Lane kebenaran Linux cepat seperti pemeriksaan bundled/plugin-contract/protocol                      | Perubahan yang relevan dengan Node   |
| `checks-fast-contracts-channels` | Pemeriksaan kontrak channel yang di-shard dengan hasil pemeriksaan agregat yang stabil               | Perubahan yang relevan dengan Node   |
| `checks-node-extensions`         | Shard pengujian Plugin bundled penuh di seluruh rangkaian extension                                  | Perubahan yang relevan dengan Node   |
| `checks-node-core-test`          | Shard pengujian Node inti, tidak termasuk lane channel, bundled, contract, dan extension             | Perubahan yang relevan dengan Node   |
| `extension-fast`                 | Pengujian terfokus hanya untuk plugin bundled yang berubah                                           | Saat perubahan extension terdeteksi  |
| `check`                          | Padanan gerbang lokal utama yang di-shard: tipe produksi, lint, guard, tipe test, dan smoke ketat   | Perubahan yang relevan dengan Node   |
| `check-additional`               | Guard arsitektur, boundary, permukaan extension, package-boundary, dan shard gateway-watch           | Perubahan yang relevan dengan Node   |
| `build-smoke`                    | Pengujian smoke CLI hasil build dan smoke memori startup                                             | Perubahan yang relevan dengan Node   |
| `checks`                         | Lane Linux Node yang tersisa: pengujian channel dan kompatibilitas Node 22 khusus push               | Perubahan yang relevan dengan Node   |
| `check-docs`                     | Format docs, lint, dan pemeriksaan tautan rusak                                                      | Docs berubah                         |
| `skills-python`                  | Ruff + pytest untuk Skills berbasis Python                                                           | Perubahan yang relevan dengan skill Python |
| `checks-windows`                 | Lane pengujian khusus Windows                                                                        | Perubahan yang relevan dengan Windows |
| `macos-node`                     | Lane pengujian TypeScript macOS menggunakan artifact build bersama                                   | Perubahan yang relevan dengan macOS  |
| `macos-swift`                    | Lint, build, dan pengujian Swift untuk aplikasi macOS                                                | Perubahan yang relevan dengan macOS  |
| `android`                        | Matriks build dan pengujian Android                                                                  | Perubahan yang relevan dengan Android |

## Urutan fail-fast

Job diurutkan agar pemeriksaan murah gagal lebih dulu sebelum job mahal berjalan:

1. `preflight` menentukan lane mana yang ada sama sekali. Logika `docs-scope` dan `changed-scope` adalah langkah di dalam job ini, bukan job terpisah.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, dan `skills-python` gagal cepat tanpa menunggu artifact yang lebih berat dan job matriks platform.
3. `build-artifacts` berjalan tumpang tindih dengan lane Linux cepat sehingga konsumen hilir dapat mulai segera setelah build bersama siap.
4. Lane platform dan runtime yang lebih berat kemudian menyebar setelah itu: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, dan `android`.

Logika cakupan berada di `scripts/ci-changed-scope.mjs` dan dicakup oleh unit test di `src/scripts/ci-changed-scope.test.ts`.
Workflow `install-smoke` yang terpisah menggunakan ulang skrip cakupan yang sama melalui job `preflight` miliknya sendiri. Workflow ini menghitung `run_install_smoke` dari sinyal changed-smoke yang lebih sempit, sehingga smoke Docker/install hanya berjalan untuk perubahan yang relevan dengan instalasi, packaging, dan container.

Logika changed-lane lokal berada di `scripts/changed-lanes.mjs` dan dijalankan oleh `scripts/check-changed.mjs`. Gerbang lokal itu lebih ketat terhadap boundary arsitektur dibanding cakupan platform CI yang luas: perubahan produksi inti menjalankan typecheck prod inti plus test inti, perubahan khusus test inti hanya menjalankan typecheck/test inti, perubahan produksi extension menjalankan typecheck prod extension plus test extension, dan perubahan khusus test extension hanya menjalankan typecheck/test extension. Perubahan Plugin SDK publik atau plugin-contract diperluas ke validasi extension karena extension bergantung pada kontrak inti tersebut. Perubahan root/config yang tidak dikenal gagal aman ke semua lane.

Pada push, matriks `checks` menambahkan lane `compat-node22` yang khusus push. Pada pull request, lane itu dilewati dan matriks tetap berfokus pada lane test/channel normal.

Keluarga test Node yang paling lambat dibagi menjadi shard include-file agar setiap job tetap kecil: kontrak channel membagi cakupan registry dan inti menjadi masing-masing delapan shard berbobot, test perintah balasan auto-reply dibagi menjadi empat shard include-pattern, dan grup prefix balasan auto-reply besar lainnya dibagi menjadi masing-masing dua shard. `check-additional` juga memisahkan kerja compile/canary package-boundary dari kerja gateway/arsitektur topologi runtime.

GitHub dapat menandai job yang tergantikan sebagai `cancelled` ketika push yang lebih baru masuk ke PR atau ref `main` yang sama. Perlakukan ini sebagai noise CI kecuali run terbaru untuk ref yang sama juga gagal. Pemeriksaan shard agregat secara eksplisit menyebut kasus pembatalan ini sehingga lebih mudah dibedakan dari kegagalan test.

## Runner

| Runner                           | Job                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, pemeriksaan Linux, pemeriksaan docs, skill Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                        |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                             |

## Padanan lokal

```bash
pnpm changed:lanes   # periksa pengklasifikasi changed-lane lokal untuk origin/main...HEAD
pnpm check:changed   # gerbang lokal cerdas: typecheck/lint/test yang berubah menurut lane boundary
pnpm check          # gerbang lokal cepat: tsgo produksi + lint ter-shard + guard cepat paralel
pnpm check:test-types
pnpm check:timed    # gerbang yang sama dengan timing per tahap
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # format docs + lint + tautan rusak
pnpm build          # bangun dist saat lane artifact/build-smoke CI relevan
```
